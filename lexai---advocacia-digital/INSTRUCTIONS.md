
# Configuração do Agente Machado e Costa Advocacia (ElevenLabs)

Para que o widget funcione corretamente, você precisa configurar um agente de IA Conversacional na ElevenLabs.

## Passo a Passo:

1. **Crie sua conta**: Acesse [ElevenLabs.io](https://elevenlabs.io/).
2. **Acesse Conversational AI**: No menu lateral, vá em "Conversational AI".
3. **Crie um Novo Agente**:
   - Clique em "Create Agent".
   - Escolha um nome (ex: Machado e Costa Assistente).
   - Configure a **System Prompt** (ex: "Você é um assistente jurídico sênior do escritório Machado e Costa Advocacia. Seja formal, prestativo e ajude na triagem de novos clientes.").
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
# Configuração do ElevenLabs (Obrigatório)
VITE_ELEVENLABS_API_KEY=sua_chave_aqui
VITE_ELEVENLABS_AGENT_ID=seu_agent_id_aqui

# Configuração do Calendly (Opcional)
# Link do Calendly para agendamento - padrão já configurado
VITE_CALENDLY_LINK=https://calendly.com/ricardo-palomar-onsmartai/30min/?month=2026-01

# API Key do Calendly (Opcional - para integração avançada via webhook)
# Para obter: https://developer.calendly.com/api-docs
VITE_CALENDLY_API_KEY=sua_calendly_api_key_aqui

# Configuração do OpenAI (Obrigatório para formatação profissional)
# API Key do OpenAI para formatar descrições profissionalmente
# Para obter: https://platform.openai.com/api-keys
VITE_OPENAI_API_KEY=sua_openai_api_key_aqui
# Modelo do OpenAI a ser usado (padrão: gpt-4o-mini)
VITE_OPENAI_MODEL=gpt-4o-mini

# Configuração do OpenAI (Obrigatório para formatação profissional)
# API Key do OpenAI para formatar descrições profissionalmente
VITE_OPENAI_API_KEY=sua_openai_api_key_aqui
# Modelo do OpenAI a ser usado (padrão: gpt-4o-mini)
VITE_OPENAI_MODEL=gpt-4o-mini
```

**Nota:** No modo "Voz", o widget usa o SDK `@elevenlabs/client` para manter uma conexão de baixa latência.

## Integração com Calendly

O sistema está configurado para detectar automaticamente quando a Sonia oferece agendar uma consulta com um especialista e quando o usuário aceita. Quando isso acontece:

1. **Detecção Automática**: O sistema detecta quando a Sonia oferece agendamento e quando o usuário aceita
2. **Captura de Contexto**: A dúvida/dor do usuário é capturada durante a conversa
3. **Link do Calendly**: Um link personalizado é enviado com a descrição profissional da consulta
4. **Pré-preenchimento**: A descrição é armazenada e pode ser pré-preenchida no Calendly através de:
   - Parâmetros na URL (campo customizado `a1`)
   - localStorage (para uso com webhooks ou API)
   - API do Calendly (se `VITE_CALENDLY_API_KEY` estiver configurada)

### Configuração do Calendly para receber descrição

Para que a descrição apareça automaticamente no campo do Calendly, você **DEVE** configurar uma pergunta customizada no seu evento:

1. **Acesse o Calendly**: Vá até as configurações do seu evento (Event Type)
2. **Adicione uma Pergunta Customizada**:
   - Vá em "Questions" ou "Perguntas"
   - Adicione uma nova pergunta do tipo "Text" (Texto livre)
   - Configure a pergunta como: "Por favor, compartilhe qualquer coisa que possa ser útil para a preparação da nossa reunião."
   - **IMPORTANTE**: Esta deve ser a **primeira pergunta customizada** do evento para que o parâmetro `a1` funcione
3. **Salve as alterações**

**Como funciona:**
- O sistema passa a descrição formatada via parâmetro `a1` na URL
- O Calendly preenche automaticamente a primeira pergunta customizada com esse texto
- Se a pergunta não existir ou não for a primeira, o texto não será pré-preenchido

**Nota sobre texto codificado:**
- Se o texto aparecer codificado (com %20, %C3%A9, etc.) no campo do Calendly, isso indica que o Calendly não está decodificando automaticamente
- Neste caso, você pode:
  1. Verificar se a pergunta customizada está configurada corretamente como a primeira pergunta
  2. Usar a API do Calendly para atualizar o evento após a criação (requer webhook)
  3. O usuário pode copiar e colar o texto decodificado manualmente

**Alternativas:**
- **Webhook**: Configure um webhook no Calendly que recebe eventos quando são criados e atualiza com a descrição usando a API
- **API diretamente**: Se tiver `VITE_CALENDLY_API_KEY`, você pode criar eventos diretamente via API com a descrição

**Importante**: O link do Calendly já está configurado por padrão. Se você quiser usar um link diferente, configure `VITE_CALENDLY_LINK` no arquivo `.env`.
