# Luktok - Sistema de Inteligência Contratual Imobiliária

## Visão Geral do Projeto
O **Luktok** é um motor automatizado para gestão do ciclo de vida de contratos imobiliários, desenhado para resolver o maior gargalo das administradoras: a perda de prazos e o risco de reajuste contratuais. 

Com foco absoluto em **privacidade e conformidade com a LGPD**, toda a inferência de Inteligência Artificial ocorre 100% offline (on-premise) utilizando o Ollama. Em vez de enviar dados sensíveis como CPFs, valores de locação, dados bancários e endereços para nuvens públicas de IA, o Luktok extrai informações estruturadas localmente e delega a matemática complexa para um motor Python determinístico. O resultado é um sistema imune a "alucinações matemáticas", garantindo cálculos exatos de multas, reajustes e vencimentos.

### Principais Casos de Uso
* **Auditoria de Prazos:** Geração automática de alertas para renovações, prazos limite para notificação de desocupação e agendamento de vistorias.
* **Projeção Financeira:** Cálculo exato de reajustes anuais com base em APIs oficiais (IPCA/IGP-M) e fracionamento automático de multas rescisórias proporcionais ao tempo restante.
* **Mitigação de Risco Jurídico:** Padronização da leitura de contratos, evitando que cláusulas dúbias ou atípicas passem despercebidas pela equipe de gestão.
* **Mitigação de Riscos:** A IA com base em todos as informações acima a LLM ira dar sugestões do que fazer para mitigar riscos.

---

## Stack Tecnológico & Infraestrutura Edge
O sistema foi desenhado sob o paradigma de *Edge Computing* (computação de borda), operando com alta eficiência em hardwares com recursos otimizados. A arquitetura conteinerizada permite que o sistema rode de forma fluida em equipamentos compactos, como um . O design modular também deixa o sistema preparado para futuras integrações com aceleradores neurais (NPUs) via interface PCIe, caso haja necessidade de processamento visual intenso (OCR de contratos escaneados).

*   **Motor de IA Local:** Ollama (rodando LLMs quantizados em formato GGUF, Llama-3.1-8B-Instruct).
*   **Backend:** Python 3, FastAPI (Arquitetura Assíncrona RESTful) e LangChain.
*   **Processamento Lógico:** Funções determinísticas em Python puro para cálculos financeiros e temporais precisos.
*   **Processamento de Documentos:** PyMuPDF (fitz) para extração de texto estruturado, preservando parágrafos e tabelas complexas.
*   **Banco de Dados:** PostgreSQL para armazenamento relacional dos metadados extraídos, contratos e alertas.
*   **Frontend:** React.js e JavaScript.
*   **Deploy e Orquestração:** Docker e Docker Compose.

---

## Segurança e LGPD (Privacy by Design)
O Luktok foi construído sob o princípio de *Privacy by Design*. Nenhum trecho do documento deixa a rede local. O uso de LLMs Open-Source rodando no servidor físico da empresa elimina o risco de que dados proprietários sejam utilizados no treinamento de modelos comerciais de terceiros (como OpenAI ou Google), oferecendo blindagem jurídica total no trato de informações pessoais de locadores e locatários.

---

## Arquitetura de Processamento: Agente Autônomo (Padrão ReAct)

O núcleo de inteligência do Luktok opera sob o paradigma **ReAct (Reasoning and Acting)**. Em vez de realizar uma leitura passiva e de mão única, o LLM atua como um agente autônomo que interage ativamente com o contrato. Apoiado pela arquitetura de hardware local — que tira proveito da aceleração do coprocessador Hailo-8 em conjunto com o Raspberry Pi 5 para lidar de forma fluida com as múltiplas requisições de inferência —, o modelo raciocina sobre as cláusulas e delega operações matemáticas e lógicas para ferramentas especializadas no backend.

### O Ciclo de Processamento
O LangChain orquestra o agente através de um loop contínuo até a interpretação completa do documento:

1. **Thought (Raciocínio):** O modelo analisa o texto, identifica uma cláusula acionável e decide qual ferramenta precisa usar. *(Ex: "Identifiquei uma rescisão antecipada. Preciso calcular o valor da multa com base no tempo restante.")*
2. **Action (Ação):** O agente suspende a geração de texto e invoca uma *Tool* escrita em Python, passando os parâmetros que acabou de ler do PDF.
3. **Observation (Observação):** O backend FastAPI executa o cálculo determinístico ou a busca de dados e devolve o resultado exato (livre de alucinações) de volta para o agente.
4. **Resolução:** O agente absorve a observação, integra a informação ao seu raciocínio e prossegue para a próxima cláusula até gerar o JSON final com todos os alertas e métricas.

### 🛠️ Tools (Ferramentas Integradas do LangChain)
Para garantir segurança jurídica e matemática exata, o agente ReAct possui um arsenal de funções Python à sua disposição:

* **Calculadora de Multa Proporcional (`CalcMulta`):** Ferramenta que recebe o prazo total, os meses cumpridos e o valor cheio da multa, devolvendo ao LLM a fração exata devida pelo locatário.
* **Oráculo Financeiro (`ConsultaIndice`):** Ao encontrar regras de reajuste, o agente aciona esta tool para consultar APIs públicas em tempo real (IBGE/BCB), aplicando as taxas atualizadas de IPCA ou IGP-M sobre o aluguel base no mês de aniversário.
* **Motor de Prazos Úteis (`CalcPrazos`):** Traduz regras subjetivas do contrato (ex: "aviso prévio de 30 dias" ou "desocupação em 5 dias úteis") em datas reais de calendário, projetando gatilhos e agendamentos de vistorias com precisão absoluta.

## Esquema de Dados Estruturado (Output Target)

Ao final do ciclo ReAct, o LLM é instruído através do LangChain (utilizando `with_structured_output`) a devolver estritamente o formato determinístico abaixo. Qualquer desvio gera um *retry* automático.

```json
{
  "locacao": {
    "tipo_imovel": "Comercial",
    "endereco_completo": "Avenida Paulista, 1000, Conj 50",
    "valor_aluguel_mensal": 5000.00,
    "indice_reajuste": "IGP-M"
  },
  "vigencia": {
    "data_inicio": "2026-11-01",
    "prazo_meses": 36
  },
  "penalidades": {
    "multa_rescisoria_base": "3 aluguéis vigentes",
    "isencao_multa_apos_meses": 12
  }
}
```
