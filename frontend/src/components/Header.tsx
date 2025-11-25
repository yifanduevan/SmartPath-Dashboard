export function Header() {
  return (
    <header className="header">
      <div style ={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="eyebrow">Smart Path</p>
          <h1>Smart Path Dashboard</h1>
        </div> 
        <div>
          <img src="/icon.png" alt="Smart Path Logo" className="logo" />
        </div>
      </div>
      
    </header>
  );
}
