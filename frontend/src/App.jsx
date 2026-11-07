import React, { useState } from 'react';
 
const API_URL = 'http://127.0.0.1:8000/upload';
const TIMEOUT_MS = 120000; // 2 minutos
 
const moeda = (v) =>
  typeof v === 'number'
    ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : v ?? '—';
 
function Resultado({ dados }) {
  // Se o backend devolver texto em vez de objeto, mostra como texto
  if (typeof dados === 'string') {
    return <pre style={estilos.pre}>{dados}</pre>;
  }
 
  const multa = dados.multa_rescisoria;
  const sugestoes = Array.isArray(dados.sugestoes) ? dados.sugestoes : [];
 
  return (
    <div>
      <h2>Resultados Extraídos & Planos de Ação</h2>
 
      <div style={estilos.card}>
        <p><strong>Aluguel:</strong> {String(dados.aluguel ?? '—')}</p>
        <p><strong>Vigência:</strong> {String(dados.vigencia ?? '—')}</p>
      </div>
 
      {multa && (
        <div style={estilos.card}>
          <h3 style={{ marginTop: 0 }}>Multa rescisória</h3>
          <p><strong>Multa cheia:</strong> {moeda(multa.multa_cheia)}</p>
          <p><strong>Prazo total:</strong> {multa.prazo_total_meses ?? '—'} meses</p>
          <p><strong>Meses cumpridos:</strong> {multa.meses_cumpridos ?? '—'}</p>
          <p><strong>Valor proporcional:</strong> {moeda(multa.valor_proporcional)}</p>
        </div>
      )}
 
      {sugestoes.length > 0 && (
        <div style={estilos.card}>
          <h3 style={{ marginTop: 0 }}>Sugestões</h3>
          <ol>
            {sugestoes.map((s, i) => (
              <li key={i}>{typeof s === 'string' ? s : JSON.stringify(s)}</li>
            ))}
          </ol>
        </div>
      )}
 
      <details style={{ marginTop: 16 }}>
        <summary>Ver JSON completo</summary>
        <pre style={estilos.pre}>{JSON.stringify(dados, null, 2)}</pre>
      </details>
    </div>
  );
}
 
function App() {
  const [arquivo, setArquivo] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);
 
  const handleFileChange = (e) => {
    setArquivo(e.target.files[0] || null);
    setResultado(null);
    setErro(null);
  };
 
  const analisarContrato = async () => {
    if (!arquivo) {
      setErro('Selecione um arquivo PDF primeiro.');
      return;
    }
 
    setCarregando(true);
    setErro(null);
    setResultado(null);
 
    const formData = new FormData();
    formData.append('arquivo', arquivo);
 
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
 
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
 
      let data = null;
      try {
        data = await response.json();
      } catch {
        // resposta sem JSON
      }
 
      if (!response.ok) {
        const detalhe =
          typeof data?.detail === 'string'
            ? data.detail
            : `Erro ${response.status} no servidor.`;
        throw new Error(detalhe);
      }
 
      if (!data || data.resultado === undefined) {
        throw new Error('Resposta inesperada do servidor.');
      }
 
      setResultado(data.resultado);
    } catch (error) {
      console.error('Erro na análise:', error);
      if (error.name === 'AbortError') {
        setErro('A análise demorou demais e foi cancelada. Tente novamente.');
      } else if (error instanceof TypeError) {
        setErro('Não consegui falar com o servidor. Confira se o backend está rodando em localhost:8000.');
      } else {
        setErro(error.message);
      }
    } finally {
      clearTimeout(timer);
      setCarregando(false);
    }
  };
 
  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>⚖️ Luktok Demo</h1>
      <p>Faça o upload de um contrato imobiliário (PDF) para análise via Agente ReAct.</p>
 
      <div style={{ marginBottom: '20px', padding: '20px', border: '2px dashed #ccc', borderRadius: '8px' }}>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button
          onClick={analisarContrato}
          disabled={carregando}
          style={{
            marginLeft: '10px',
            padding: '8px 16px',
            background: carregando ? '#7a9cc6' : '#0056b3',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: carregando ? 'wait' : 'pointer',
          }}
        >
          {carregando ? 'Analisando com IA...' : 'Extrair e Analisar'}
        </button>
        {carregando && (
          <p style={{ color: '#555', marginBottom: 0 }}>
            Isso pode levar de 10 a 40 segundos, aguarde.
          </p>
        )}
      </div>
 
      {erro && (
        <div style={{ background: '#fdecea', color: '#a12622', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
          {erro}
        </div>
      )}
 
      {resultado && <Resultado dados={resultado} />}
    </div>
  );
}
 
const estilos = {
  card: { background: '#f4f4f4', padding: '16px 20px', borderRadius: '8px', marginBottom: '12px' },
  pre: { background: '#f4f4f4', padding: '20px', borderRadius: '8px', overflowX: 'auto', whiteSpace: 'pre-wrap' },
};
 
export default App;