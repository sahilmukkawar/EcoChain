import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const CustomerHelpCenter: React.FC = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{sender: string, text: string, timestamp: Date}>>([]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  // Mock FAQ data
  const faqs = [
    {
      question: 'How do I schedule a waste pickup?',
      answer: 'You can schedule a waste pickup from your dashboard. Navigate to the "Schedule Pickup" section, select the waste type, quantity, and preferred pickup date.'
    },
    {
      question: 'How are EcoTokens calculated?',
      answer: 'EcoTokens are calculated based on the type and quantity of waste you recycle. Different materials have different token rates based on their environmental impact and recycling value.'
    },
    {
      question: 'Can I use EcoTokens for all marketplace purchases?',
      answer: 'Yes, you can use EcoTokens for up to 30% of the purchase value on any product in our marketplace.'
    },
    {
      question: 'How do I track my environmental impact?',
      answer: 'Your environmental impact is displayed on your dashboard. It shows metrics like CO2 saved, trees equivalent, and water saved based on your recycling activities.'
    },
    {
      question: 'What types of waste can I recycle through EcoChain?',
      answer: 'EcoChain accepts plastic, paper, glass, metal, and electronics for recycling. Each category has specific guidelines for preparation before pickup.'
    }
  ];

  // Mock support categories
  const supportCategories = [
    { title: 'Account Issues', count: 12 },
    { title: 'Pickup Problems', count: 8 },
    { title: 'Marketplace Questions', count: 15 },
    { title: 'Token System', count: 10 },
    { title: 'Technical Support', count: 7 }
  ];

  const handleSendMessage = () => {
    if (message.trim() === '') return;
    
    // Add user message to chat history
    const newUserMessage = {
      sender: 'You',
      text: message,
      timestamp: new Date()
    };
    
    setChatHistory([...chatHistory, newUserMessage]);
    setMessage('');
    
    // Simulate automated response after a short delay
    setTimeout(() => {
      const autoResponse = {
        sender: 'EcoChain Support',
        text: 'Thank you for your message. Our support team will get back to you within 24 hours. In the meantime, you might find an answer in our FAQ section.',
        timestamp: new Date()
      };
      
      setChatHistory(prevChat => [...prevChat, autoResponse]);
    }, 1000);
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
      <h1>Customer Help Center</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        {/* Left sidebar with support categories */}
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h3>Support Categories</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {supportCategories.map((category, index) => (
              <li key={index} style={{ 
                padding: '12px', 
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ fontWeight: 'bold' }}>{category.title}</div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>{category.count} articles</div>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Main content area */}
        <div>
          {/* FAQ section */}
          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
            <h3>Frequently Asked Questions</h3>
            
            {faqs.map((faq, index) => (
              <div key={index} style={{ border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}>
                <button
                  onClick={() => toggleFaq(index)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  {faq.question}
                  <span style={{ fontSize: '1.2rem' }}>
                    {expandedFaq === index ? '−' : '+'}
                  </span>
                </button>
                {expandedFaq === index && (
                  <div style={{ padding: '16px', borderTop: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Live chat section */}
          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>Live Support Chat</h3>
            
            <div style={{ 
              height: '300px', 
              overflowY: 'auto', 
              marginBottom: '16px', 
              padding: '16px', 
              backgroundColor: '#f5f5f5',
              borderRadius: '4px'
            }}>
              {chatHistory.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', marginTop: '100px' }}>
                  Start a conversation with our support team
                </div>
              ) : (
                chatHistory.map((chat, index) => (
                  <div 
                    key={index} 
                    style={{
                      display: 'flex', 
                      justifyContent: chat.sender === 'You' ? 'flex-end' : 'flex-start',
                      marginBottom: '16px'
                    }}
                  >
                    <div 
                      style={{
                        padding: '12px', 
                        maxWidth: '70%',
                        backgroundColor: chat.sender === 'You' ? '#e3f2fd' : 'white',
                        borderRadius: '8px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                        {chat.sender}
                      </div>
                      <div style={{ margin: '4px 0' }}>{chat.text}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        {chat.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Help Section */}
      <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4>Email Support</h4>
          <p>For detailed inquiries, email us at:</p>
          <a href="mailto:support@ecochain.com" style={{ color: '#1976d2', textDecoration: 'none' }}>
            support@ecochain.com
          </a>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4>Phone Support</h4>
          <p>Call us during business hours:</p>
          <strong>1-800-ECO-CHAIN</strong>
          <br />
          <small>Mon-Fri: 9AM-6PM EST</small>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4>Community Forum</h4>
          <p>Join our community discussions:</p>
          <a href="/forum" style={{ color: '#1976d2', textDecoration: 'none' }}>
            Visit EcoChain Forum
          </a>
        </div>
      </div>
    </div>
  );
};

export default CustomerHelpCenter;