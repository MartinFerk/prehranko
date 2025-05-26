import React, { useState } from 'react';

function App() {
  const [name, setName] = useState('');
  const [response, setResponse] = useState('');

  const sendData = async () => {
    const res = await fetch('https://prehranko-production.up.railway.app/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    setResponse(data.message);

    
  };

  return (
    <div>
      <h1>Frontend → Backend</h1>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={sendData}>Pošlji</button>
      <p>Odgovor: {response}</p>
    </div>
  );
}

export default App;
