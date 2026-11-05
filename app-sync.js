import {SUPABASE_URL,SUPABASE_ANON_KEY} from "./supabase-config.js";
const $=i=>document.getElementById(i),box=$("auth"),msg=$("amsg"),form=$("aform");
const say=(t,ok)=>{msg.textContent=t||"";msg.style.color=ok?"var(--ok)":"var(--bad)"};
if(/PASTE_/.test(SUPABASE_URL+SUPABASE_ANON_KEY)){$("aload").hidden=true;form.hidden=true;say("Setup needed: open supabase-config.js, paste your Supabase values, then upload the app again.")}
else{
 const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm");
 const sb=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
 const nice=e=>{const m=(e&&e.message||"").toLowerCase();
  if(m.includes("invalid login"))return"Wrong email or password.";
  if(m.includes("already registered"))return"That email already has an account. Try signing in.";
  if(m.includes("password should"))return"Use at least 6 characters.";
  if(m.includes("email not confirmed"))return"Please open the confirmation email we sent, then sign in.";
  if(m.includes("rate limit")||m.includes("too many"))return"Too many tries. Wait a few minutes.";
  if(m.includes("fetch")||m.includes("network"))return"No internet connection.";
  if(m.includes("invalid email")||m.includes("valid email"))return"That email address does not look right.";
  return"Something went wrong. Please try again."};
 let mode="in",user=null,started=null;
 const setMode=m=>{mode=m;$("abtn").textContent=m=="in"?"Sign in":"Create account";$("aswitch").textContent=m=="in"?"New here? Create an account":"Already have an account? Sign in";$("atitle").textContent=m=="in"?"Sign in":"Create your account";say("")};
 $("aswitch").onclick=()=>setMode(mode=="in"?"up":"in");
 $("areset").onclick=async()=>{const em=$("aemail").value.trim();if(!em){say("Type your email first, then tap Forgot password.");return}
  const {error}=await sb.auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname});say(error?nice(error):"Reset link sent. Check your email.",!error)};
 form.onsubmit=async e=>{e.preventDefault();say("");$("abtn").disabled=true;
  try{const email=$("aemail").value.trim(),password=$("apw").value;
   if(mode=="in"){const {error}=await sb.auth.signInWithPassword({email,password});if(error)say(nice(error))}
   else{const {data,error}=await sb.auth.signUp({email,password});if(error)say(nice(error));else if(!data.session){say("Account created. Check your email and tap the confirmation link, then sign in.",true);setMode("in")}}
  }catch(x){say(nice(x))}$("abtn").disabled=false};
 const adapter=uid=>{const cbs=[];
  const get=async()=>{const {data,error}=await sb.from("states").select("json,at").eq("user_id",uid).maybeSingle();if(error)throw error;return data};
  return{
   get:async()=>{const d=await get();return{exists:!!d,data:()=>d}},
   set:async d=>{const {error}=await sb.from("states").upsert({user_id:uid,json:d.json,at:d.at});if(error)throw error},
   onSnapshot:(cb,er)=>{const fire=d=>d&&cb({exists:true,data:()=>d,metadata:{}});
    try{sb.channel("st-"+uid).on("postgres_changes",{event:"*",schema:"public",table:"states",filter:"user_id=eq."+uid},p=>fire(p.new)).subscribe()}catch(e){}
    const poll=()=>{if(document.visibilityState=="visible")get().then(fire).catch(()=>{})};
    document.addEventListener("visibilitychange",poll);addEventListener("focus",poll);setInterval(poll,60000);return()=>{}}}};
 const start=async()=>{if(!user||started===user.id)return;started=user.id;
  try{await initSync(adapter(user.id))}catch(e){started=null;setSt("local")}};
 addEventListener("online",()=>{if(user&&!SY.ref){started=null;start()}});
 const out=async()=>{try{if(SY.dirty){clearTimeout(SY.timer);await push()}}catch(e){}try{localStorage.removeItem("studytracker.uid")}catch(e){}wipeLocal();await sb.auth.signOut();location.reload()};
 const onUser=u=>{user=u;$("aload").hidden=true;
  if(!u){window.__signOut=null;window.__acct="";form.hidden=false;box.hidden=false;return}
  box.hidden=true;let last=null;try{last=localStorage.getItem("studytracker.uid")}catch(e){}
  if(last&&last!==u.id)wipeLocal();
  try{localStorage.setItem("studytracker.uid",u.id)}catch(e){}
  window.__acct=u.email||"";window.__signOut=out;render();start()};
 sb.auth.onAuthStateChange((ev,s)=>{if(ev=="PASSWORD_RECOVERY"){const p=prompt("Type your new password (6+ characters)");if(p)sb.auth.updateUser({password:p}).then(({error})=>alert(error?nice(error):"Password changed."))}
  onUser(s&&s.user||null)});
 setMode("in")}
