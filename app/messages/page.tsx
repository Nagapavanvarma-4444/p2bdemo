"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { p2b_api_call } from "@/lib/api";

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const initialRecipientId = searchParams.get('user');
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('p2b_user');
    if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
    }
    
    fetchConversations();
    if (initialRecipientId) {
       setSelectedPartner(initialRecipientId);
    }
  }, [initialRecipientId]);

  useEffect(() => {
    if (selectedPartner) {
      fetchMessages(selectedPartner);
    }
  }, [selectedPartner]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchConversations() {
    try {
      const res = await p2b_api_call('/messages');
      setConversations(res.conversations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(partnerId: string) {
    try {
      const res = await p2b_api_call(`/messages?recipientId=${partnerId}`);
      setMessages(res.messages || []);
      
      // The API now returns the partner info as part of the list fetch or we can deduce it
      if (res.messages?.length > 0) {
          const partnerMsg = res.messages.find((m: any) => m.sender_id === partnerId);
          if (partnerMsg?.sender) setPartnerInfo(partnerMsg.sender);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner) return;

    try {
      const res = await p2b_api_call('/messages', {
        method: 'POST',
        body: { recipient_id: selectedPartner, content: newMessage }
      });
      setMessages(prev => [...prev, { ...res.message, sender_id: user.id }]);
      setNewMessage("");
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="dashboard-page" style={{ height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
      <div className="dashboard-container" style={{ height: '100%', padding: '0', maxWidth: '1400px', margin: '0 auto', display: 'flex' }}>
        
        {/* SIDEBAR: Conversations */}
        <div style={{ width: '350px', backgroundColor: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto' }}>
          <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
             <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Conversations</h3>
          </div>
          <div className="convo-list">
            {conversations.length === 0 && !selectedPartner && (
              <div style={{ padding: '30px', textAlign: 'center', opacity: 0.4 }}>No chats yet</div>
            )}
            {conversations.map((item, i) => {
              const partner = item.partner;
              const isActive = selectedPartner === partner.id;
              return (
                <div 
                  key={i} 
                  onClick={() => { setSelectedPartner(partner.id); setPartnerInfo(partner); }}
                  style={{ 
                    padding: '18px 25px', 
                    cursor: 'pointer',
                    backgroundColor: isActive ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                    borderLeft: isActive ? '4px solid var(--gold)' : '4px solid transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {partner.name?.charAt(0) || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: isActive ? 'var(--gold)' : 'white' }}>{partner.name}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                      {item.lastMessage}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN: Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(0,0,0,0.15)' }}>
          {selectedPartner ? (
             <>
               <div style={{ padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'var(--gold)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {partnerInfo?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h4 style={{ margin: 0 }}>{partnerInfo?.name || "Professional"}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gold)', opacity: 0.8, textTransform: 'capitalize' }}>{partnerInfo?.role}</span>
                    </div>
                  </div>
               </div>
               
               <div style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {messages.map((m, i) => {
                    const isMe = m.sender_id === user?.id;
                    return (
                      <div key={i} style={{ 
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '70%'
                      }}>
                        <div style={{ 
                          backgroundColor: isMe ? 'var(--gold)' : 'rgba(212, 175, 55, 0.08)',
                          color: isMe ? 'black' : 'white',
                          padding: '12px 18px',
                          borderRadius: isMe ? '18px 18px 0 18px' : '18px 18px 18px 0',
                          fontSize: '0.95rem',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}>
                          {m.content}
                        </div>
                        <span style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '4px' }}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
               </div>

               <form onSubmit={handleSendMessage} style={{ padding: '25px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', gap: '15px', maxWidth: '1000px', margin: '0 auto' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ borderRadius: '25px', padding: '12px 25px' }}
                      placeholder={`Message ${partnerInfo?.name || 'Partner'}...`}
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                    />
                    <button className="btn btn-gold" style={{ borderRadius: '25px', padding: '0 30px' }}>Send</button>
                  </div>
               </form>
             </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
              <div style={{ fontSize: '5rem', marginBottom: '20px' }}>📩</div>
              <h2>Select a conversation to start chatting</h2>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
