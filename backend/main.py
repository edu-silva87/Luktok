import pymupdf  # Leitor de PDF
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from langchain_ollama import ChatOllama
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

app = FastAPI(title="Luktok Demo API - Edição Local (Ollama)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PARTE 1: Leitor de PDF ---
def ler_pdf(file_bytes: bytes) -> str:
    """Lê o PDF em memória e extrai o texto."""
    doc = pymupdf.open(stream=file_bytes, filetype="pdf")
    texto = "\n".join([pagina.get_text() for pagina in doc])
    return texto

# --- PARTE 2: Tool para o Agente ReAct ---
@tool
def calcular_multa_proporcional(multa_cheia: float, prazo_total_meses: int, meses_cumpridos: int) -> float:
    """
    Calcula a multa rescisória proporcional.
    Use esta ferramenta para descobrir o valor da multa se o inquilino sair antes do prazo.
    """
    meses_restantes = prazo_total_meses - meses_cumpridos
    if meses_restantes <= 0:
        return 0.0
    valor_proporcional = (multa_cheia / prazo_total_meses) * meses_restantes
    return round(valor_proporcional, 2)

# --- PARTE 3: Análise com o Llama 3.2 (Local) ---
def analisar_com_agente(texto_contrato: str) -> str:
    # Apontando para o Llama 3.2 rodando no seu PC
    llm = ChatOllama(
        model="llama3.2:1b",
        temperature=0,
        base_url="http://localhost:11434"
    )
    tools = [calcular_multa_proporcional]
    
    agente = create_react_agent(llm, tools)
    
    # Prompt simplificado e direto (SLMs funcionam melhor com instruções curtas)
    prompt_texto = f"""
    Leia o contrato abaixo. Se o contrato tiver regra de multa de R$ 9000 para 30 meses e o inquilino sair no mês 10, você DEVE usar a ferramenta 'calcular_multa_proporcional'.
    
    Retorne a resposta em formato JSON estrito contendo:
    - "aluguel": valor extraído
    - "vigencia": prazo extraído
    - "multa_calculada": valor da ferramenta
    - "sugestoes": lista com 3 passos a seguir baseados no contrato.
    
    Contrato: {texto_contrato}
    """

    resposta = agente.invoke({"messages": [("user", prompt_texto)]})
    return resposta["messages"][-1].content

# --- ENDPOINT DA API ---
@app.post("/upload")
async def upload_contrato(arquivo: UploadFile = File(...)):
    print(f"\n📥 1. Recebendo arquivo: {arquivo.filename}")
    conteudo = await arquivo.read()
    
    print("📄 2. Extraindo texto do PDF...")
    texto_extraido = ler_pdf(conteudo)
    print(f"✅ Texto extraído! {len(texto_extraido)} caracteres.")
    
    print("🤖 3. Enviando para o Llama 3.2:1b (Isso vai exigir bastante do seu PC, aguarde)...")
    try:
        resultado_json = analisar_com_agente(texto_extraido)
        print("✅ 4. Análise concluída com sucesso!")
        return {"resultado": resultado_json}
    except Exception as e:
        print(f"❌ ERRO NA IA: {e}")
        return {"resultado": f"Erro interno: {e}"}