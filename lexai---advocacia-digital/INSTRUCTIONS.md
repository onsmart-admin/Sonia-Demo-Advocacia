
# Configuração do Agente LexAI (ElevenLabs)

Para que o widget funcione corretamente, você precisa configurar um agente de IA Conversacional na ElevenLabs.

## Passo a Passo:

1. **Crie sua conta**: Acesse [ElevenLabs.io](https://elevenlabs.io/).
2. **Acesse Conversational AI**: No menu lateral, vá em "Conversational AI".
3. **Crie um Novo Agente**:
   - Clique em "Create Agent".
   - Escolha um nome (ex: LexAI Assistente).
   - Configure a **System Prompt** (ex: "Você é um assistente jurídico sênior do escritório LexAI. Seja formal, prestativo e ajude na triagem de novos clientes.").
4. **Obtenha o Agent ID**:
   - Após criar, o ID aparecerá na URL ou na aba "Settings" do agente.
   - Copie esse ID e cole no seu arquivo `.env` como `VITE_ELEVENLABS_AGENT_ID`.
5. **Obtenha a API Key**:
   - Vá em suas configurações de perfil -> "API Keys".
   - Gere uma chave e coloque no `.env` como `VITE_ELEVENLABS_API_KEY`.
6. **Permissões**:
   - Certifique-se de que o site tem permissão para usar o microfone (o código já lida com o pedido de permissão).

## Variáveis de Ambiente (.env)

```env
VITE_ELEVENLABS_API_KEY=sua_chave_aqui
VITE_ELEVENLABS_AGENT_ID=seu_agent_id_aqui
```

**Nota:** No modo "Voz", o widget usa o SDK `@elevenlabs/client` para manter uma conexão de baixa latência.
