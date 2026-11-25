
import React, { FormEvent, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { io, Socket } from "socket.io-client";
import "./style.css";

type User = { id: string; email: string; displayName: string; role: string };
type Product = { id: string; title: string; category: string; description?: string; imageUrl?: string; buyUrl?: string; price: number; currency: string; updatedAt: string };
type Post = { id: string; title: string; body: string; createdAt: string; author: { displayName: string } };
type Message = { id: string; body: string; createdAt: string; author: { id: string; displayName: string } };

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...(init.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data as T;
}
function safeHttpUrl(value?: string) {
  try { const u = new URL(value || ""); return (u.protocol === "https:" || u.protocol === "http:") && !["example.com", "www.example.com"].includes(u.hostname); } catch { return false; }
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState("Home");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [adminJson, setAdminJson] = useState("");
  const [integrationProvider, setIntegrationProvider] = useState("razorpay");
  const [integrationSecrets, setIntegrationSecrets] = useState("{}");
  const [integrationEnabled, setIntegrationEnabled] = useState(false);

  useEffect(() => { api<{user:User}>("/api/auth/me").then(v => setUser(v.user)).catch(() => setUser(null)); }, []);
  useEffect(() => {
    if (!user) { socket?.disconnect(); setSocket(null); return; }
    const s = io({ withCredentials: true, transports: ["websocket", "polling"] });
    s.on("connect", () => s.emit("room:join", "global", (v: {messages?:Message[]}) => setMessages(v.messages || [])));
    s.on("message:new", (m:Message) => setMessages(old => old.some(x => x.id === m.id) ? old : [...old, m]));
    s.on("connect_error", () => setNotice("Chat connection failed. Please sign in again or check the API server."));
    setSocket(s);
    return () => { s.disconnect(); };
  }, [user]);
  useEffect(() => {
    if (tab === "Community") api<{items:Post[]}>("/api/community/posts").then(v => setPosts(v.items)).catch(e => setNotice(e.message));
  }, [tab]);
  useEffect(() => {
    if (tab === "Discover") api<{items:Product[]}>("/api/discover/products").then(v => setProducts(v.items)).catch(e => setNotice(e.message));
  }, [tab]);

  async function submitAuth(e: FormEvent) {
    e.preventDefault(); setBusy(true); setNotice("");
    try {
      const path = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = authMode === "login" ? { email, password } : { email, password, displayName };
      const result = await api<{user:User}>(path, { method: "POST", body: JSON.stringify(body) });
      setUser(result.user); setPassword(""); setTab("Home"); setNotice("Welcome to YAS Chat.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Sign in failed"); }
    finally { setBusy(false); }
  }
  async function searchProducts(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try { const v = await api<{items:Product[];notice?:string}>("/api/discover/products?q=" + encodeURIComponent(query)); setProducts(v.items); setNotice(v.notice || (v.items.length ? "" : "No connected product feed has supplied verified listings yet.")); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Product search failed"); }
    finally { setBusy(false); }
  }
  async function createPost(e: FormEvent) {
    e.preventDefault();
    try {
      const csrf = await api<{csrfToken:string}>("/api/csrf");
      await api("/api/community/posts", { method: "POST", headers: { "x-csrf-token": csrf.csrfToken }, body: JSON.stringify({ title: postTitle, body: postBody }) });
      setPostTitle(""); setPostBody(""); const v = await api<{items:Post[]}>("/api/community/posts"); setPosts(v.items); setNotice("Post published.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Could not publish post"); }
  }
  function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!socket || !messageText.trim()) return;
    socket.emit("message:send", { roomId: "global", body: messageText.trim() }, (v:{error?:string}) => {
      if (v?.error) setNotice(v.error); else setMessageText("");
    });
  }
  async function saveAdminSettings(e: FormEvent) {\n    e.preventDefault();\n    try { const value = JSON.parse(adminJson); const csrf = await api<{csrfToken:string}>("/api/csrf"); const result = await api<{notice:string}>("/api/admin/settings", { method:"PUT", headers:{"x-csrf-token":csrf.csrfToken}, body:JSON.stringify(value) }); setNotice(result.notice); } catch (e) { setNotice(e instanceof Error ? e.message : "Could not save settings"); }\n  }\n  async function saveIntegration(e: FormEvent) {\n    e.preventDefault();\n    try { const secrets = JSON.parse(integrationSecrets) as Record<string,string>; const csrf = await api<{csrfToken:string}>("/api/csrf"); const result = await api<{notice:string}>(`/api/admin/integrations/${integrationProvider}`, { method:"PUT", headers:{"x-csrf-token":csrf.csrfToken}, body:JSON.stringify({enabled:integrationEnabled,secrets}) }); setNotice(result.notice); setIntegrationSecrets("{}"); } catch (e) { setNotice(e instanceof Error ? e.message : "Could not save integration"); }\n  }\n  async function logout() {
    try { const csrf = await api<{csrfToken:string}>("/api/csrf"); await api("/api/auth/logout", { method:"POST", headers:{"x-csrf-token":csrf.csrfToken} }); }
    finally { setUser(null); setMessages([]); setTab("Home"); }
  }

  const tabs = ["Home", "Chats", "Community", "Discover", "Profile", ...(user?.role === "ADMIN" ? ["Admin"] : [])];
  return <main className="shell">
    <header className="top"><div className="brand"><span className="mark">Y</span><div><b>YAS CHAT</b><small>Community · Chat · Discovery</small></div></div><div className="userbox">{user ? <><span>{user.displayName}</span><button className="quiet" onClick={logout}>Logout</button></> : <span className="status">Guest</span>}</div></header>
    <nav className="nav">{tabs.map(t => <button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t}</button>)}</nav>
    {notice && <div className="notice" role="status">{notice}<button className="quiet" onClick={()=>setNotice("")}>×</button></div>}
    {tab === "Home" && <><section className="hero"><p className="eyebrow">WELCOME TO YAS CHAT</p><h1>Connect, discuss<br/>and discover.</h1><p className="muted">एक जगह पर बातचीत, समुदाय और उत्पादों की जानकारी।</p><div className="search"><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search products" placeholder="Search products…" /><button onClick={()=>setTab("Discover")}>Discover</button></div></section><section className="grid">{[["Chats","Private messages and public rooms"],["Community","Questions, answers and discussions"],["Discover","Products with source-linked evidence"],["Calls","Audio/video calling setup is not yet enabled"]].map(([name,desc])=><button className="tile" key={name} onClick={()=>setTab(name==="Calls"?"Profile":name)}><div className="tileTop"><h2>{name}</h2><span>›</span></div><p>{desc}</p></button>)}</section></>}
    {tab === "Profile" && <section className="panel"><h2>Account</h2>{user ? <><p>{user.displayName} · {user.email}</p><p className="muted">Role: {user.role}</p><button onClick={logout}>Log out</button></> : <><h3>{authMode === "login" ? "Sign in" : "Create account"}</h3><form className="form" onSubmit={submitAuth}>{authMode==="register" && <input required minLength={2} maxLength={60} value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Display name"/>}<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/><input required minLength={authMode==="register"?12:1} maxLength={128} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={authMode==="register"?"Password (at least 12 characters)":"Password"}/><button disabled={busy}>{busy?"Please wait…":authMode==="login"?"Sign in":"Create account"}</button></form><button className="quiet" onClick={()=>setAuthMode(authMode==="login"?"register":"login")}>{authMode==="login"?"New here? Create account":"Already registered? Sign in"}</button></>}</section>}
    {tab === "Admin" && user?.role === "ADMIN" && <section className="panel"><h2>Admin Control Center</h2><p className="muted">Manage subscription prices, feature switches and provider credentials. Secrets are encrypted at rest. Live checkout/calls remain disabled until provider adapters are implemented and verified.</p><form className="form" onSubmit={saveAdminSettings}><label>Monetization configuration (JSON)</label><textarea rows={18} value={adminJson} onChange={e=>setAdminJson(e.target.value)} spellCheck={false}/><button>Save advertising & subscription settings</button></form><hr/><h3>Connect provider API later</h3><form className="form" onSubmit={saveIntegration}><select value={integrationProvider} onChange={e=>setIntegrationProvider(e.target.value)}><option value="razorpay">Razorpay payments</option><option value="stripe">Stripe payments</option><option value="clickbank">ClickBank products</option><option value="shareasale">ShareASale products</option><option value="livekit">LiveKit audio/video calls</option><option value="twilio">Twilio communications</option><option value="youtube">YouTube reviews</option><option value="translation">Translation provider</option></select><label>Provider credentials JSON. Never paste credentials in public chat.</label><textarea rows={5} value={integrationSecrets} onChange={e=>setIntegrationSecrets(e.target.value)} spellCheck={false}/><label><input type="checkbox" checked={integrationEnabled} onChange={e=>setIntegrationEnabled(e.target.checked)}/> Enable integration after credentials are saved</label><button>Save provider settings</button></form><p className="muted">Payment provider adapters, webhook signature verification, paid call entitlements, ad serving and WebRTC/TURN/SFU are separate implementation gates; saving keys here does not activate live billing or calls.</p></section>}
    {tab === "Discover" && <section className="panel"><div className="sectionHead"><h2>Product Discovery</h2><span className="muted">Verified provider data only</span></div><form className="search" onSubmit={searchProducts}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products or category…" /><button disabled={busy}>Search</button></form>{products.length===0?<p className="muted">No product feed is connected yet. No sample prices, ratings or affiliate links are being invented.</p>:<div className="products">{products.map(p=><article className="product" key={p.id}>{p.imageUrl&&safeHttpUrl(p.imageUrl)&&<img src={p.imageUrl} alt={p.title}/>}<small>{p.category}</small><h3>{p.title}</h3><p>{p.description}</p><b>{new Intl.NumberFormat(undefined,{style:"currency",currency:p.currency}).format(p.price)}</b>{p.buyUrl&&safeHttpUrl(p.buyUrl)&&<a href={p.buyUrl} target="_blank" rel="noopener noreferrer sponsored nofollow">Merchant offer ↗</a>}</article>)}</div>}</section>}
    {tab === "Community" && <section className="panel"><h2>Community Q&A</h2>{user?<form className="form" onSubmit={createPost}><input required minLength={4} maxLength={180} value={postTitle} onChange={e=>setPostTitle(e.target.value)} placeholder="Question or post title"/><textarea required maxLength={10000} value={postBody} onChange={e=>setPostBody(e.target.value)} placeholder="Write your post…"/><button>Publish post</button></form>:<p className="muted">Sign in to publish a question or post.</p>}<div className="postList">{posts.map(p=><article className="post" key={p.id}><h3>{p.title}</h3><p>{p.body}</p><small>By {p.author.displayName} · {new Date(p.createdAt).toLocaleString()}</small></article>)}</div></section>}
    {tab === "Chats" && <section className="panel"><div className="sectionHead"><h2>Global Room</h2><span className="muted">{user?"Realtime connection":"Sign in required"}</span></div>{!user?<p className="muted">Please sign in from Profile to use the chat.</p>:<><div className="messages">{messages.map(m=><article className={m.author.id===user.id?"mine":"message"} key={m.id}><b>{m.author.displayName}</b><p>{m.body}</p><small>{new Date(m.createdAt).toLocaleTimeString()}</small></article>)}</div><form className="search" onSubmit={sendMessage}><input value={messageText} onChange={e=>setMessageText(e.target.value)} maxLength={5000} placeholder="Write a message…"/><button>Send</button></form></>}</section>}
    <footer>YAS Chat · Hindi / English · Privacy first · Do not share passwords or private information.</footer>
  </main>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
