// server.js

// --- 1. Importação das Bibliotecas ---
const express = require('express');
const { put, list, del } = require('@vercel/blob');
const dotenv = require('dotenv');
const path = require('path');

// --- 2. Configuração Inicial ---
dotenv.config();
const app = express();

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));

// --- 3. Definição das Rotas da API ---

// Rota para UPLOAD de arquivos (método POST)
app.post('/api/upload', async (req, res) => {
  const filename = req.headers['x-vercel-filename'];

  if (!filename) {
    return res.status(400).json({ message: 'O nome do arquivo é obrigatório no cabeçalho x-vercel-filename.' });
  }

  try {
    const blob = await put(filename, req, {
      access: 'public',
    });

    res.status(200).json(blob);
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ message: 'Erro ao fazer upload do arquivo.', error: error.message });
  }
});

// Rota para LISTAR os arquivos da galeria (método GET)
app.get('/api/files', async (req, res) => {
  try {
    const { blobs } = await list();
    res.status(200).json(blobs);
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    res.status(500).json({ message: 'Erro ao buscar a lista de arquivos.', error: error.message });
  }
});

// Rota para EXCLUIR um arquivo (método DELETE)
app.delete('/api/delete', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'A URL do arquivo é obrigatória.' });
  }

  try {
    await del(url);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir:', error);
    res.status(500).json({ message: 'Erro ao excluir o arquivo.', error: error.message });
  }
});

// Rota para RENOMEAR um arquivo (método POST)
app.post('/api/rename', async (req, res) => {
  const { url, newFilename } = req.body;

  if (!url || !newFilename) {
    return res.status(400).json({ message: 'A URL e o novo nome são obrigatórios.' });
  }

  try {
    // 1. Baixar o blob existente
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao baixar o blob: ${response.statusText}`);
    }
    
    const blobData = await response.arrayBuffer();
    
    // 2. Fazer upload do blob com o novo nome
    const newBlob = await put(newFilename, blobData, {
      access: 'public',
    });
    
    // 3. Excluir o blob antigo
    await del(url);
    
    res.status(200).json(newBlob);
  } catch (error) {
    console.error('Erro ao renomear:', error);
    res.status(500).json({ message: 'Erro ao renomear o arquivo.', error: error.message });
  }
});

// --- 4. Servindo o Frontend ---
app.use(express.static(path.join(__dirname, 'public')));

// --- 5. Inicialização do Servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});