
import React, { useState, useEffect, useRef } from 'react';
import { Conversation } from '@elevenlabs/client';

interface ElevenLabsWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const ElevenLabsWidget: React.FC<ElevenLabsWidgetProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'voice'>('voice');
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Estados para controle de agendamento
  const [hasOfferedScheduling, setHasOfferedScheduling] = useState(false);
  const [userIssue, setUserIssue] = useState<string>('');
  
  const conversationRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasOfferedSchedulingRef = useRef<boolean>(false);
  const lastModeRef = useRef<string>('');
  const modeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Acessar variáveis de ambiente do Vite
  const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || '';
  const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
  const CALENDLY_LINK = import.meta.env.VITE_CALENDLY_LINK || 'https://calendly.com/ricardo-palomar-onsmartai/30min/?month=2026-01';
  const CALENDLY_API_KEY = import.meta.env.VITE_CALENDLY_API_KEY || '';
  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
  const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Limpar conexão quando o widget fechar
  useEffect(() => {
    if (!isOpen) {
      stopConversation();
    }
  }, [isOpen]);

  // Iniciar conversa em modo voz
  const startVoiceConversation = async () => {
    if (!AGENT_ID) {
      alert('Configuração ausente: Por favor, adicione o VITE_ELEVENLABS_AGENT_ID no seu arquivo .env.local');
      return;
    }

    try {
      // Solicitar permissão de microfone
      await navigator.mediaDevices.getUserMedia({ audio: true });

      setIsLoading(true);

      // Configuração da sessão com callbacks
      const config: any = {
        agentId: AGENT_ID,
        textOnly: false, // Habilita voz
        connectionType: 'webrtc', // ou 'websocket'
        onConnect: () => {
          console.log('Conectado ao ElevenLabs');
          setIsConnected(true);
          setIsLoading(false);
        },
        onDisconnect: () => {
          console.log('Desconectado do ElevenLabs');
          setIsConnected(false);
          setIsSpeaking(false);
          setIsLoading(false);
        },
        onMessage: (message: any) => {
          console.log('Mensagem recebida (voz):', message);
          
          if (message.message || message.text || message.transcript) {
            const text = message.message || message.text || message.transcript;
            const role = message.source === 'user' ? 'user' : 'ai';
            
            console.log(`[VOZ] Role: ${role}, Text: "${text.substring(0, 100)}"`);
            console.log(`[VOZ] hasOfferedSchedulingRef: ${hasOfferedSchedulingRef.current}`);
            
            // Se for mensagem da IA, verificar se ofereceu agendamento
            if (role === 'ai') {
              const isOffer = detectSchedulingOffer(text);
              console.log(`[VOZ] É oferta de agendamento? ${isOffer}`);
              if (isOffer) {
                console.log('[VOZ] IA ofereceu agendamento - marcando estado');
                handleSchedulingOffer();
                // Continuar normalmente para adicionar a mensagem da IA
              }
            }
            
            // Se for mensagem do usuário e já oferecemos agendamento, verificar aceitação
            if (role === 'user' && hasOfferedSchedulingRef.current) {
              const isAcceptance = detectSchedulingAcceptance(text);
              console.log(`[VOZ] É aceitação? ${isAcceptance}`);
              
              if (isAcceptance) {
                console.log('[VOZ] ✅ ACEITAÇÃO DETECTADA - Interceptando e processando');
                
                // IMPORTANTE: Encerrar a conversa IMEDIATAMENTE para evitar que a IA responda
                stopConversation();
                hasOfferedSchedulingRef.current = false;
                setHasOfferedScheduling(false);
                
                // Adicionar mensagem do usuário
                const userMessageObj = { role: 'user' as const, text };
                setMessages(prev => [...prev, userMessageObj]);
                updateConversationContext(userMessageObj);
                
                // Processar agendamento e redirecionar (modo voz) - sem enviar para a IA
                handleSchedulingAcceptance(text, 'voice');
                return; // CRÍTICO: Não adicionar mensagem normal, não enviar para a IA
              }
            }
            
            // Mensagem normal - adicionar normalmente
            const newMessage = { role, text };
            setMessages(prev => [...prev, newMessage]);
            updateConversationContext(newMessage);
          }
        },
        onError: (error: any) => {
          console.error('Erro ElevenLabs:', error);
          setIsLoading(false);
          alert(`Erro na conexão: ${error.message || 'Erro desconhecido'}`);
        },
        onModeChange: (mode: any) => {
          console.log('Modo mudou:', mode);
          
          // Limpar timeout anterior se existir
          if (modeChangeTimeoutRef.current) {
            clearTimeout(modeChangeTimeoutRef.current);
          }
          
          const newMode = mode.mode || mode;
          const isSpeaking = newMode === 'speaking';
          
          // Se mudou para "speaking", atualizar imediatamente
          if (isSpeaking && lastModeRef.current !== 'speaking') {
            console.log('[MODO] Mudando para SPEAKING');
            lastModeRef.current = 'speaking';
            setIsSpeaking(true);
            return;
          }
          
          // Se mudou para "listening" ou outro modo, aguardar um pouco para confirmar
          // Isso evita trocas rápidas durante pausas na fala
          if (!isSpeaking && lastModeRef.current === 'speaking') {
            console.log('[MODO] Detectou possível mudança para LISTENING - aguardando confirmação...');
            
            modeChangeTimeoutRef.current = setTimeout(() => {
              // Verificar novamente se ainda não está falando
              // Se após 500ms ainda não voltou para speaking, confirma a mudança
              if (lastModeRef.current === 'speaking') {
                console.log('[MODO] Confirmando mudança para LISTENING');
                lastModeRef.current = 'listening';
                setIsSpeaking(false);
              }
            }, 500); // Aguardar 500ms antes de confirmar a mudança
          } else if (!isSpeaking && lastModeRef.current !== 'listening') {
            // Se não estava em speaking e mudou para outro modo, atualizar imediatamente
            console.log('[MODO] Mudando para LISTENING (não estava falando)');
            lastModeRef.current = 'listening';
            setIsSpeaking(false);
          }
        }
      };

      // Se tiver API key, adicionar (para agentes privados)
      if (API_KEY) {
        config.apiKey = API_KEY;
      }

      conversationRef.current = await Conversation.startSession(config);

      // Event listeners adicionais (se suportados)
      if (conversationRef.current.on) {
        conversationRef.current.on('audio', (audioBlob: Blob) => {
          console.log('Áudio recebido');
          // Reproduzir o áudio automaticamente
          const audio = new Audio(URL.createObjectURL(audioBlob));
          audio.play().catch((err: any) => {
            console.error('Erro ao reproduzir áudio:', err);
          });
        });
      }

    } catch (err: any) {
      console.error('Falha ao iniciar conversa de voz:', err);
      setIsLoading(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Acesso ao microfone negado. Por favor, permita o acesso ao microfone nas configurações do navegador.');
      } else {
        alert(`Erro ao iniciar conversa: ${err.message || 'Erro desconhecido'}`);
      }
    }
  };

  // Iniciar conversa em modo texto
  const startTextConversation = async () => {
    if (!AGENT_ID) {
      alert('Configuração ausente: Por favor, adicione o VITE_ELEVENLABS_AGENT_ID no seu arquivo .env.local');
      return;
    }

    try {
      setIsLoading(true);

      const config: any = {
        agentId: AGENT_ID,
        textOnly: true, // Modo apenas texto
        connectionType: 'websocket',
        onConnect: () => {
          console.log('Conectado ao ElevenLabs (texto)');
          setIsConnected(true);
          setIsLoading(false);
        },
        onDisconnect: () => {
          console.log('Desconectado do ElevenLabs');
          setIsConnected(false);
          setIsLoading(false);
        },
        onMessage: (message: any) => {
          console.log('Mensagem recebida (texto):', message);
          if (message.message || message.text || message.transcript) {
            const text = message.message || message.text || message.transcript;
            const role = message.source === 'user' ? 'user' : 'ai';
            
            // Se for mensagem da IA, verificar se ofereceu agendamento
            if (role === 'ai') {
              if (detectSchedulingOffer(text)) {
                // Apenas marcar que ofereceu agendamento, mas mostrar a mensagem normal da IA
                console.log('IA ofereceu agendamento (texto) - aguardando aceitação do usuário');
                handleSchedulingOffer();
                // Continuar normalmente para adicionar a mensagem da IA
              }
            }
            
            // Se for mensagem do usuário e já oferecemos agendamento, verificar aceitação
            if (role === 'user' && hasOfferedScheduling) {
              if (detectSchedulingAcceptance(text)) {
                console.log('Usuário aceitou agendamento (texto) - interceptando e enviando link');
                
                // Adicionar mensagem do usuário primeiro
                const userMessageObj = { role: 'user' as const, text };
                setMessages(prev => [...prev, userMessageObj]);
                updateConversationContext(userMessageObj);
                
                // Processar agendamento (modo texto) - não enviar para a IA
                handleSchedulingAcceptance(text, 'text');
                return; // CRÍTICO: Não enviar para a IA
              }
            }
            
            // Mensagem normal - adicionar normalmente
            const newMessage = { role, text };
            setMessages(prev => [...prev, newMessage]);
            updateConversationContext(newMessage);
          }
        },
        onError: (error: any) => {
          console.error('Erro ElevenLabs:', error);
          setIsLoading(false);
          alert(`Erro na conexão: ${error.message || 'Erro desconhecido'}`);
        }
      };

      if (API_KEY) {
        config.apiKey = API_KEY;
      }

      conversationRef.current = await Conversation.startSession(config);

    } catch (err: any) {
      console.error('Falha ao iniciar conversa de texto:', err);
      setIsLoading(false);
      alert(`Erro ao iniciar conversa: ${err.message || 'Erro desconhecido'}`);
    }
  };

  const stopConversation = async () => {
    // Limpar timeout de mudança de modo
    if (modeChangeTimeoutRef.current) {
      clearTimeout(modeChangeTimeoutRef.current);
      modeChangeTimeoutRef.current = null;
    }
    
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch (err) {
        console.error('Erro ao encerrar sessão:', err);
      }
      conversationRef.current = null;
      setIsConnected(false);
      setIsSpeaking(false);
      setIsLoading(false);
      lastModeRef.current = '';
    }
  };

  const resetConversation = async () => {
    await stopConversation();
    setMessages([]);
    setInputText('');
    setHasOfferedScheduling(false);
    hasOfferedSchedulingRef.current = false;
    setUserIssue('');
  };

  // Função para detectar se a Sonia ofereceu agendamento
  // Deve ser mais restritiva - só detectar quando realmente oferecer
  const detectSchedulingOffer = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    
    // Padrões MUITO específicos que indicam uma oferta real de agendamento
    // Deve conter tanto uma palavra de oferta quanto uma palavra de agendamento
    const mustHaveOfferWord = /(posso|deseja|gostaria|quer|podemos|desejo|ofereço|sugiro|recomendo)/i.test(text);
    const mustHaveSchedulingWord = /(agendar|agendamento|marcar|consulta|reunião|horário|especialista)/i.test(text);
    
    // Padrões específicos que indicam oferta clara
    const clearOfferPatterns = [
      /posso.*agendar.*(consulta|reunião|especialista)/i,
      /deseja.*agendar.*(consulta|reunião|especialista)/i,
      /gostaria.*agendar.*(consulta|reunião|especialista)/i,
      /quer.*agendar.*(consulta|reunião|especialista)/i,
      /podemos.*agendar.*(consulta|reunião|especialista)/i,
      /agendar.*(consulta|reunião).*especialista/i,
      /marcar.*(consulta|reunião).*especialista/i,
      /(consulta|reunião).*especialista.*agendar/i,
      /(consulta|reunião).*especialista.*marcar/i
    ];
    
    // Verificar padrões claros primeiro
    const matchesClearPattern = clearOfferPatterns.some(pattern => pattern.test(text));
    
    // Se não tiver padrão claro, verificar se tem AMBAS as palavras necessárias
    // E também verificar se não é apenas uma pergunta do usuário
    const isUserQuestion = /^(eu|minha|meu|estou|sou|tenho|preciso)/i.test(text.trim());
    
    // Só considerar oferta se:
    // 1. Tem padrão claro OU
    // 2. Tem palavra de oferta E palavra de agendamento E não é pergunta do usuário
    return matchesClearPattern || (mustHaveOfferWord && mustHaveSchedulingWord && !isUserQuestion);
  };

  // Função para detectar se o usuário aceitou agendar
  const detectSchedulingAcceptance = (text: string): boolean => {
    if (!text || typeof text !== 'string') return false;
    
    const lowerText = text.toLowerCase().trim();
    console.log(`[DETECÇÃO] Verificando aceitação no texto: "${lowerText}"`);
    
    // Respostas diretas de aceitação (mais flexível)
    const directAcceptance = [
      'sim',
      'quero',
      'aceito',
      'ok',
      'perfeito',
      'ótimo',
      'vamos',
      'pode ser',
      'claro',
      'com certeza',
      'pode',
      'pode sim',
      'quero sim',
      'sim quero',
      'sim por favor',
      'quero agendar',
      'quero marcar',
      'sim quero agendar',
      'sim quero marcar',
      'quero sim agendar',
      'quero sim marcar',
      'pode agendar',
      'pode marcar',
      'vamos agendar',
      'vamos marcar',
      'aceito agendar',
      'aceito marcar',
      'tudo bem',
      'tá bom',
      'está bem',
      'pode ser sim',
      'quero isso',
      'quero sim isso'
    ];
    
    // Verificar se contém alguma frase de aceitação
    const hasDirectAcceptance = directAcceptance.some(phrase => {
      const found = lowerText.includes(phrase);
      if (found) console.log(`[DETECÇÃO] ✅ Encontrou frase de aceitação: "${phrase}"`);
      return found;
    });
    
    if (hasDirectAcceptance) {
      console.log('[DETECÇÃO] ✅ Aceitação detectada por frase direta');
      return true;
    }
    
    // Verificar padrões de aceitação
    const acceptancePatterns = [
      /^(sim|quero|aceito|ok|perfeito|ótimo|vamos|claro|pode).*$/i,
      /.*(quero|aceito|vamos).*(agendar|marcar|consulta|reunião).*/i,
      /.*(sim|ok|perfeito|ótimo).*(agendar|marcar|consulta|reunião).*/i,
      /.*(agendar|marcar|consulta|reunião).*(sim|quero|aceito|ok).*/i
    ];
    
    const matchesPattern = acceptancePatterns.some(pattern => {
      const matches = pattern.test(text);
      if (matches) console.log(`[DETECÇÃO] ✅ Padrão correspondido: ${pattern}`);
      return matches;
    });
    
    if (matchesPattern) {
      console.log('[DETECÇÃO] ✅ Aceitação detectada por padrão');
      return true;
    }
    
    console.log('[DETECÇÃO] ❌ Aceitação NÃO detectada');
    return false;
  };

  // Função para formatar descrição usando GPT
  const formatDescriptionWithGPT = async (userIssue: string): Promise<string> => {
    if (!OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY não configurada, usando formatação básica');
      return generateBasicDescription(userIssue);
    }

    try {
      const prompt = `Você é um assistente jurídico profissional. Com base na seguinte dúvida/problema do cliente, crie uma descrição profissional e clara para ser enviada ao especialista em um agendamento.

Dúvida/Problema do cliente:
${userIssue || 'Cliente buscou orientação jurídica através do assistente virtual.'}

Crie uma descrição profissional, objetiva e clara que:
1. Seja formal e respeitosa
2. Resuma o problema/dúvida do cliente de forma clara
3. Seja útil para o especialista se preparar para a consulta
4. Tenha no máximo 300 palavras
5. Use português brasileiro formal

Formato da resposta (sem markdown, apenas texto puro):
Consulta agendada através do assistente virtual Sonia (Machado e Costa Advocacia).

Problema/Dúvida do Cliente:
[descrição formatada aqui]

Este agendamento foi realizado após triagem inicial realizada pelo assistente virtual.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente jurídico profissional que formata descrições de consultas de forma clara e objetiva.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API OpenAI: ${response.status}`);
      }

      const data = await response.json();
      const formattedDescription = data.choices[0]?.message?.content?.trim() || '';
      
      if (formattedDescription) {
        return formattedDescription;
      } else {
        throw new Error('Resposta vazia da API OpenAI');
      }
    } catch (error) {
      console.error('Erro ao formatar descrição com GPT:', error);
      // Fallback para formatação básica
      return generateBasicDescription(userIssue);
    }
  };

  // Função para gerar descrição básica (fallback)
  const generateBasicDescription = (userIssue: string): string => {
    let description = 'Consulta agendada através do assistente virtual Sonia (Machado e Costa Advocacia).\n\n';
    
    if (userIssue && userIssue.trim().length > 0) {
      let formattedIssue = userIssue.trim();
      formattedIssue = formattedIssue.charAt(0).toUpperCase() + formattedIssue.slice(1);
      if (!/[.!?]$/.test(formattedIssue)) {
        formattedIssue += '.';
      }
      description += `Problema/Dúvida do Cliente:\n${formattedIssue}\n\n`;
    } else {
      description += `Problema/Dúvida do Cliente:\nCliente buscou orientação jurídica através do assistente virtual.\n\n`;
    }
    
    description += 'Este agendamento foi realizado após triagem inicial realizada pelo assistente virtual.';
    return description;
  };

  // Função para gerar descrição profissional da dúvida/dor do usuário
  const generateProfessionalDescription = async (): Promise<string> => {
    // Extrair a dúvida principal das mensagens
    const mainIssue = extractMainIssue(messages);
    
    // Usar GPT para formatar a descrição
    return await formatDescriptionWithGPT(mainIssue);
  };

  // Função para criar link do Calendly com descrição
  const createCalendlyLink = (description: string): string => {
    const baseUrl = CALENDLY_LINK.split('?')[0];
    const existingParams = CALENDLY_LINK.includes('?') ? CALENDLY_LINK.split('?')[1] : '';
    
    // Armazenar descrição completa no localStorage para uso posterior (webhook ou API)
    const descriptionId = `calendly_desc_${Date.now()}`;
    localStorage.setItem(descriptionId, description);
    localStorage.setItem('last_calendly_description', description);
    
    // Calendly permite campos customizados via URL usando a1, a2, a3, etc.
    // IMPORTANTE: O Calendly precisa ter uma pergunta customizada configurada no evento
    // para que o parâmetro a1 funcione. Se não tiver, o texto não será pré-preenchido.
    const params = new URLSearchParams(existingParams);
    
    // Limitar tamanho para evitar problemas com URLs muito longas
    // Calendly tem limite de ~2000 caracteres na URL
    const maxLength = 1500;
    let descriptionToUse = description;
    
    if (description.length > maxLength) {
      descriptionToUse = description.substring(0, maxLength) + '...';
    }
    
    // IMPORTANTE: O Calendly precisa ter uma pergunta customizada configurada
    // O parâmetro a1 corresponde à primeira pergunta customizada do evento
    // URLSearchParams já faz a codificação necessária para URL automaticamente
    // Não usar encodeURIComponent adicional para evitar dupla codificação
    params.set('a1', descriptionToUse);
    
    // Armazenar descrição completa para referência
    sessionStorage.setItem('calendly_description', description);
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Função para marcar que a IA ofereceu agendamento (sem enviar link ainda)
  const handleSchedulingOffer = () => {
    // Apenas marcar que a IA ofereceu agendamento
    // O link só será enviado quando o usuário ACEITAR
    setHasOfferedScheduling(true);
    hasOfferedSchedulingRef.current = true;
    console.log('IA ofereceu agendamento - aguardando aceitação do usuário');
  };

  // Função para enviar link do Calendly quando usuário aceitar
  const handleSchedulingAcceptance = async (userMessage?: string, mode: 'text' | 'voice' = 'text') => {
    setIsLoading(true);
    
    try {
      // Gerar descrição profissional baseada nas mensagens usando GPT
      const description = await generateProfessionalDescription();
      
      // Criar link do Calendly
      const calendlyLink = createCalendlyLink(description);
      
      if (mode === 'voice') {
        // Modo VOZ: Agradecer de forma educada e redirecionar
        const thankYouMessage = `Muito obrigada pelo contato! Foi um imenso prazer poder ajudá-la hoje. Desejo que tudo dê certo e que você encontre a solução que precisa. Agora vou direcioná-la para a página de agendamento com nosso especialista.\n\n🔗 ${calendlyLink}\n\nSe a página não abrir automaticamente, clique no link acima. Tenha um ótimo dia!`;
        
        // Adicionar mensagem de agradecimento com o link
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: thankYouMessage 
        }]);
        
        // Aguardar um pouco para a mensagem ser exibida e ouvida (4 segundos)
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // Tentar abrir em nova aba, se falhar (pop-up bloqueado), redirecionar na mesma aba
        try {
          const newWindow = window.open(calendlyLink, '_blank');
          
          // Verificar se o pop-up foi bloqueado
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            console.log('Pop-up bloqueado, redirecionando na mesma aba');
            // Se pop-up foi bloqueado, redirecionar na mesma aba após um breve delay
            setTimeout(() => {
              window.location.href = calendlyLink;
            }, 1000);
          }
        } catch (error) {
          console.error('Erro ao abrir pop-up:', error);
          // Em caso de erro, redirecionar na mesma aba
          setTimeout(() => {
            window.location.href = calendlyLink;
          }, 1000);
        }
        
        // Resetar estados
        setHasOfferedScheduling(false);
        setIsLoading(false);
      } else {
        // Modo TEXTO: Enviar link no chat
        const calendlyMessage = `Perfeito! Aqui está o link para você agendar sua consulta com nosso especialista:\n\n${calendlyLink}\n\nAo abrir o link, sua dúvida será automaticamente preenchida no campo de descrição. Se não aparecer automaticamente, você pode copiar e colar a descrição que está preparada para o especialista.`;
        
        setMessages(prev => {
          // Evitar duplicação - verificar se já existe uma mensagem com o link
          const hasCalendlyLink = prev.some(m => m.text.includes(calendlyLink));
          if (hasCalendlyLink) {
            return prev;
          }
          return [...prev, { 
            role: 'ai', 
            text: calendlyMessage 
          }];
        });

        // Se tiver API key do Calendly, podemos usar webhook para pré-preencher
        if (CALENDLY_API_KEY) {
          try {
            console.log('Descrição preparada para Calendly:', description);
          } catch (error) {
            console.error('Erro ao processar agendamento:', error);
          }
        }
        
        // Resetar estados
        setHasOfferedScheduling(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Erro ao gerar descrição:', error);
      setIsLoading(false);
      
      // Enviar link mesmo com erro na formatação
      const fallbackDescription = generateBasicDescription(extractMainIssue(messages));
      const calendlyLink = createCalendlyLink(fallbackDescription);
      
      if (mode === 'voice') {
        // Modo VOZ: Agradecer e redirecionar mesmo com erro
        const thankYouMessage = `Muito obrigada pelo contato! Foi um imenso prazer poder ajudá-la hoje. Desejo que tudo dê certo e que você encontre a solução que precisa. Agora vou direcioná-la para a página de agendamento com nosso especialista.\n\n🔗 ${calendlyLink}\n\nSe a página não abrir automaticamente, clique no link acima. Tenha um ótimo dia!`;
        
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: thankYouMessage 
        }]);
        
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // Tentar abrir em nova aba, se falhar, redirecionar na mesma aba
        try {
          const newWindow = window.open(calendlyLink, '_blank');
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            setTimeout(() => {
              window.location.href = calendlyLink;
            }, 1000);
          }
        } catch (error) {
          setTimeout(() => {
            window.location.href = calendlyLink;
          }, 1000);
        }
      } else {
        // Modo TEXTO: Enviar link no chat
        const calendlyMessage = `Perfeito! Aqui está o link para você agendar sua consulta com nosso especialista:\n\n${calendlyLink}\n\nAo selecionar a data e horário, sua dúvida será automaticamente compartilhada com o especialista para que possamos preparar melhor o atendimento.`;
        
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: calendlyMessage 
        }]);
      }
      
      setHasOfferedScheduling(false);
    }
  };

  // Função para limpar e normalizar texto
  const cleanText = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .trim()
      .replace(/\s+/g, ' ') // Múltiplos espaços em um
      .replace(/\n+/g, ' ') // Quebras de linha em espaços
      .replace(/[^\w\s.,!?;:()\-áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/g, '') // Remover caracteres especiais exceto pontuação básica
      .trim();
  };

  // Função para extrair a dúvida principal do usuário
  const extractMainIssue = (messages: Message[]): string => {
    // Pegar apenas mensagens do usuário que não são aceitação, saudações ou muito curtas
    const userMessages = messages
      .filter(m => {
        if (m.role !== 'user') return false;
        if (detectSchedulingAcceptance(m.text)) return false;
        
        const text = m.text.trim().toLowerCase();
        // Filtrar saudações comuns
        if (/^(oi|olá|ola|bom dia|boa tarde|boa noite|olá sonia|oi sonia)$/i.test(text)) return false;
        // Filtrar mensagens muito curtas
        if (text.length < 15) return false;
        
        return true;
      })
      .map(m => cleanText(m.text))
      .filter(text => text.length > 15); // Filtrar mensagens muito curtas após limpeza
    
    if (userMessages.length === 0) return '';
    
    // Pegar a primeira mensagem relevante (geralmente é a dúvida principal)
    let mainIssue = userMessages[0];
    
    // Limitar tamanho da mensagem principal
    if (mainIssue.length > 300) {
      mainIssue = mainIssue.substring(0, 300) + '...';
    }
    
    return mainIssue;
  };

  // Função para atualizar contexto da conversa
  const updateConversationContext = (newMessage: Message) => {
    if (newMessage.role === 'user') {
      // Não capturar mensagens de aceitação ou muito curtas
      if (!detectSchedulingAcceptance(newMessage.text) && newMessage.text.trim().length > 10) {
        // Atualizar apenas com a mensagem atual (será processada quando necessário)
        setUserIssue(newMessage.text);
      }
    }
    // Não precisamos mais do conversationContext completo, vamos usar apenas as mensagens
  };

  const handleToggleConversation = () => {
    if (isConnected) {
      stopConversation();
    } else {
      if (activeTab === 'voice') {
        startVoiceConversation();
      } else {
        startTextConversation();
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversationRef.current || !isConnected) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Verificar se o usuário aceitou agendar (antes de enviar para a IA)
    if (hasOfferedScheduling && detectSchedulingAcceptance(userMessage)) {
      console.log('Usuário aceitou agendamento no chat de texto - enviando link do Calendly');
      setIsLoading(false);
      
      // Adicionar mensagem do usuário primeiro
      const userMessageObj = { role: 'user' as const, text: userMessage };
      setMessages(prev => [...prev, userMessageObj]);
      updateConversationContext(userMessageObj);
      
      // Processar agendamento (modo texto - não enviar para a IA)
      handleSchedulingAcceptance(userMessage, 'text');
      return;
    }

    // Mensagem normal - adicionar e enviar para a IA
    const userMessageObj = { role: 'user' as const, text: userMessage };
    setMessages(prev => [...prev, userMessageObj]);
    updateConversationContext(userMessageObj);

    try {
      // Enviar mensagem de texto para o agente
      // Tenta sendText primeiro, depois sendUserMessage como fallback
      if (typeof conversationRef.current.sendText === 'function') {
        await conversationRef.current.sendText(userMessage);
      } else if (typeof conversationRef.current.sendUserMessage === 'function') {
        await conversationRef.current.sendUserMessage(userMessage);
      } else {
        throw new Error('Método de envio de mensagem não encontrado');
      }
      console.log('Mensagem enviada:', userMessage);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      setIsLoading(false);
      alert(`Erro ao enviar mensagem: ${err.message || 'Erro desconhecido'}`);
    }
  };

  // Mudar de aba - reiniciar conexão se necessário
  const handleTabChange = (tab: 'text' | 'voice') => {
    if (isConnected) {
      stopConversation();
      setMessages([]);
    }
    setActiveTab(tab);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[90vw] max-w-[420px] h-[650px] max-h-[85vh] bg-navy-card border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="p-5 bg-navy-dark border-b border-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
          <div>
            <h3 className="text-gold font-serif text-lg leading-none">Consulta Sonia</h3>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1">
              {isConnected ? 'Sessão Ativa' : isLoading ? 'Conectando...' : 'Pronto para Atendimento'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={resetConversation}
            className="text-gray-500 hover:text-gold transition-colors p-2 rounded-lg hover:bg-white/5"
            title="Reiniciar Conversa"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-navy-dark px-4 pt-2 border-b border-gray-800">
        <button 
          onClick={() => handleTabChange('voice')}
          className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === 'voice' ? 'border-gold text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" /></svg>
          Voz
        </button>
        <button 
          onClick={() => handleTabChange('text')}
          className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === 'text' ? 'border-gold text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" /><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" /></svg>
          Chat
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow p-6 flex flex-col bg-gradient-to-b from-navy-card to-navy-dark overflow-hidden">
        {activeTab === 'voice' ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center min-h-0">
            <div className="flex-grow flex flex-col items-center justify-center w-full overflow-y-auto pb-4">
              <div className={`relative mb-6 p-6 rounded-full bg-navy-dark border border-gray-800 text-gold transition-all duration-500 mx-4 ${isSpeaking ? 'animate-pulse-gold' : ''}`} style={{ minWidth: 'fit-content' }}>
                {isConnected && (
                  <div className="absolute inset-0 border-2 border-gold rounded-full animate-ping opacity-20" style={{ margin: '-2px' }}></div>
                )}
                <svg className="w-16 h-16 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              
              <h4 className="text-xl font-semibold text-white mb-3">
                {isLoading ? 'Conectando...' : isConnected ? (isSpeaking ? 'Sonia está respondendo...' : 'Pode falar, estou ouvindo...') : 'Consultoria por Voz'}
              </h4>
              <p className="text-gray-500 text-sm max-w-[280px] mb-6 leading-relaxed italic">
                {isLoading 
                  ? 'Estabelecendo conexão com o assistente...'
                  : isConnected 
                    ? 'Nossa IA jurídica está capturando sua solicitação para triagem imediata.' 
                    : 'Clique no botão abaixo para iniciar uma sessão de voz privada com nosso assistente.'}
              </p>

              {/* Mostrar mensagens de voz também */}
              {messages.length > 0 && (
                <div className="w-full max-w-sm mb-4 max-h-32 overflow-y-auto space-y-2">
                  {messages.slice(-3).map((m, i) => (
                    <div key={i} className={`text-xs p-2 rounded ${m.role === 'user' ? 'bg-gold/20 text-gold' : 'bg-navy-dark text-gray-300'}`}>
                      {m.role === 'user' ? 'Você' : 'Sonia'}: {m.text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botão sempre visível na parte inferior */}
            <div className="mt-auto pt-4 w-full flex justify-center">
              <button 
                onClick={handleToggleConversation}
                disabled={isLoading}
                className={`px-12 py-4 rounded-full font-bold transition-all shadow-xl flex items-center gap-3 ${isLoading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : isConnected ? 'bg-red-600/20 text-red-500 border border-red-600/50 hover:bg-red-600/30' : 'bg-gold text-black hover:bg-yellow-500 hover:scale-105'}`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Conectando...
                  </>
                ) : isConnected ? (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    Finalizar Chamada
                  </>
                ) : 'Iniciar Conversa'}
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col h-full overflow-hidden">
            {!isConnected && (
              <div className="mb-4 p-4 bg-navy-dark border border-gray-800 rounded-lg text-center">
                <p className="text-sm text-gray-400 mb-3">Para iniciar o chat, clique no botão abaixo</p>
                <button
                  onClick={handleToggleConversation}
                  disabled={isLoading}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${isLoading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gold text-black hover:bg-yellow-500'}`}
                >
                  {isLoading ? 'Conectando...' : 'Conectar ao Chat'}
                </button>
              </div>
            )}
            
            <div className="flex-grow overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40 text-center px-4">
                  <div className="bg-white/5 p-4 rounded-full mb-4">
                    <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  </div>
                  <p className="text-xs uppercase tracking-widest font-bold text-white mb-2">Canal de Texto Seguro</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    {isConnected 
                      ? 'Descreva seu problema jurídico brevemente para uma triagem inicial automatizada.'
                      : 'Conecte-se para iniciar uma conversa com nosso assistente jurídico.'}
                  </p>
                </div>
              ) : (
                messages.map((m, i) => {
                  // Função para renderizar links nas mensagens
                  const renderMessageText = (text: string) => {
                    // Detectar markdown links [text](url) primeiro
                    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                    let processedText = text;
                    const markdownLinks: Array<{ match: string; text: string; url: string }> = [];
                    let match;
                    
                    while ((match = markdownLinkRegex.exec(text)) !== null) {
                      markdownLinks.push({
                        match: match[0],
                        text: match[1],
                        url: match[2]
                      });
                    }
                    
                    // Substituir markdown links por placeholders temporários
                    markdownLinks.forEach((link, idx) => {
                      processedText = processedText.replace(link.match, `__MARKDOWN_LINK_${idx}__`);
                    });
                    
                    // Detectar URLs diretas
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const parts = processedText.split(urlRegex);
                    
                    return parts.map((part, idx) => {
                      // Verificar se é um placeholder de markdown link
                      const markdownMatch = part.match(/^__MARKDOWN_LINK_(\d+)__$/);
                      if (markdownMatch) {
                        const linkIndex = parseInt(markdownMatch[1]);
                        const link = markdownLinks[linkIndex];
                        return (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gold underline hover:text-yellow-400 break-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(link.url, '_blank');
                            }}
                          >
                            {link.text}
                          </a>
                        );
                      }
                      
                      // Verificar se é uma URL direta
                      if (urlRegex.test(part)) {
                        return (
                          <a
                            key={idx}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gold underline hover:text-yellow-400 break-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(part, '_blank');
                            }}
                          >
                            {part.length > 60 ? `${part.substring(0, 60)}...` : part}
                          </a>
                        );
                      }
                      
                      // Texto normal - quebrar linhas
                      return part.split('\n').map((line, lineIdx) => (
                        <React.Fragment key={`${idx}-${lineIdx}`}>
                          {line}
                          {lineIdx < part.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ));
                    });
                  };
                  
                  return (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${m.role === 'user' ? 'bg-gold text-black rounded-tr-none' : 'bg-navy-dark border border-gray-800 text-gray-200 rounded-tl-none'}`}>
                        <div className="whitespace-pre-wrap break-words">
                          {renderMessageText(m.text)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {isLoading && messages.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-navy-dark border border-gray-800 text-gray-200 rounded-2xl rounded-tl-none p-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gold rounded-full animate-pulse"></div>
                      Machado e Costa está digitando...
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="relative mt-auto">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isConnected ? "Como podemos ajudar?" : "Conecte-se primeiro..."}
                disabled={!isConnected || isLoading}
                className="w-full bg-navy-dark border border-gray-800 rounded-xl py-4 px-5 text-sm text-gray-200 focus:outline-none focus:border-gold transition-colors pr-14 shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button 
                type="submit"
                disabled={!inputText.trim() || !isConnected || isLoading}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${inputText.trim() && isConnected && !isLoading ? 'bg-gold text-black hover:bg-yellow-500' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="p-4 text-center text-[9px] text-gray-600 uppercase tracking-widest border-t border-gray-800 bg-navy-dark flex items-center justify-center gap-2">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        Criptografia de Ponta a Ponta Lex-Safe
      </div>
    </div>
  );
};

export default ElevenLabsWidget;
