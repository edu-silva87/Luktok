import time
from main import ler_pdf, analisar_com_agente

print("1) Agente com texto curto...")
t = time.time()
r = analisar_com_agente(
    "CONTRATO DE LOCAÇÃO. Aluguel de R$ 2.000,00 por mês. "
    "Prazo de 30 meses. Multa de R$ 9.000,00 por rescisão antecipada."
)
print(r)
print(f"OK em {time.time() - t:.1f}s\n")

print("2) Leitura do PDF...")
caminho = input("Caminho do PDF (ex: C:\\Users\\roger\\contrato.pdf): ").strip('"')
t = time.time()
with open(caminho, "rb") as f:
    texto = ler_pdf(f.read())
print(f"{len(texto)} caracteres extraídos em {time.time() - t:.1f}s\n")

print("3) Agente com o texto do PDF...")
t = time.time()
print(analisar_com_agente(texto))
print(f"OK em {time.time() - t:.1f}s")