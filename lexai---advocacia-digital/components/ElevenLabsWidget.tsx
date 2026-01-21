
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
  
  const conversationRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Acessar variáveis de ambiente do Vite
  const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || '';
  const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || '';

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
          console.log('Mensagem recebida:', message);
          if (message.message || message.text || message.transcript) {
            const text = message.message || message.text || message.transcript;
            const role = message.source === 'user' ? 'user' : 'ai';
            setMessages(prev => [...prev, { 
              role, 
              text 
            }]);
          }
        },
        onError: (error: any) => {
          console.error('Erro ElevenLabs:', error);
          setIsLoading(false);
          alert(`Erro na conexão: ${error.message || 'Erro desconhecido'}`);
        },
        onModeChange: (mode: any) => {
          console.log('Modo mudou:', mode);
          setIsSpeaking(mode.mode === 'speaking');
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
          console.log('Mensagem recebida:', message);
          if (message.message || message.text || message.transcript) {
            const text = message.message || message.text || message.transcript;
            const role = message.source === 'user' ? 'user' : 'ai';
            setMessages(prev => [...prev, { 
              role, 
              text 
            }]);
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
    }
  };

  const resetConversation = async () => {
    await stopConversation();
    setMessages([]);
    setInputText('');
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
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInputText('');
    setIsLoading(true);

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
                messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${m.role === 'user' ? 'bg-gold text-black rounded-tr-none' : 'bg-navy-dark border border-gray-800 text-gray-200 rounded-tl-none'}`}>
                      {m.text}
                    </div>
                  </div>
                ))
              )}
              {isLoading && messages.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-navy-dark border border-gray-800 text-gray-200 rounded-2xl rounded-tl-none p-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gold rounded-full animate-pulse"></div>
                      LexAI está digitando...
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
