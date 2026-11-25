import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  const sections = [
    ["Chats", "Private messages, groups and rooms"],
    ["Community", "Questions, answers and discussions"],
    ["Discover", "Product search with source-linked evidence"],
    ["Calls", "Audio/video calling when signaling and TURN are configured"],
    ["Profile", "Account, language and privacy settings"],
  ];
  return <main className="shell">
    <header className="top"><div className="brand"><span className="mark">Y</span><div><b>YAS CHAT</b><small>Community · Chat · Discovery</small></div></div><span className="status">Unified workspace</span></header>
    <section className="hero"><p className="eyebrow">WELCOME TO YAS CHAT</p><h1>Connect, discuss<br/>and discover.</h1><p className="muted">एक जगह पर बातचीत, समुदाय और उत्पादों की जानकारी।</p><div className="search"><input aria-label="Search" placeholder="Search people, rooms or products…" /><button type="button">Search</button></div></section>
    <section className="grid">{sections.map(([name,desc])=><article className="tile" key={name}><div className="tileTop"><h2>{name}</h2><span>›</span></div><p>{desc}</p><small>Module integration in progress</small></article>)}</section>
    <footer>YAS Chat · Hindi / English · Privacy first</footer>
  </main>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);