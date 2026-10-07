(()=>{
const $=s=>document.querySelector(s),pet=$('#pet'),log=$('#log'),inp=$('#t'),lab=$('#mood');
const NOME={feliz:'feliz',bravo:'bravo',dormindo:'dormindo',triste:'triste',amando:'apaixonado',surpreso:'surpreso',rindo:'rindo',pensando:'pensando'};
const FIXO=['feliz','bravo','dormindo'],ACORDA=/acord|desperta|levanta|bom dia/;
const n=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''),R=a=>a[Math.random()*a.length|0];
let mood='feliz',rest='feliz',hist=[],busy=false,hold,idle,cur,ty,anger=0;

function show(m){mood=m;pet.dataset.mood=m;pet.querySelectorAll('.x').forEach(g=>g.classList.toggle('on',g.classList.contains(m)));lab.textContent='Bup está '+NOME[m]}
function set(m,ms){clearTimeout(hold);if(FIXO.includes(m))rest=m;show(m);if(!FIXO.includes(m))hold=setTimeout(()=>show(rest),ms||3500)}
function add(role,txt){const e=document.createElement('div');e.className='m '+role;e.textContent=txt;log.append(e);while(log.children.length>40)log.firstChild.remove();log.scrollTop=log.scrollHeight;return e}
function say(txt){if(cur)cur.el.textContent=cur.txt;clearInterval(ty);const el=add('b','');cur={el,txt};let i=0;ty=setInterval(()=>{el.textContent=txt.slice(0,++i);log.scrollTop=log.scrollHeight;if(i>=txt.length)clearInterval(ty)},22)}

/* Resposta local, usada quando a API do Grok não está disponível */
function local(msg){
  const t=n(msg),has=r=>r.test(t);
  if(has(/me matar|suicid|quero morrer|me cortar/))return{mood:'triste',reply:'Ei, isso me preocupa. Você não está sozinho: fale com alguém de confiança. No Brasil, o CVV atende no 188, a qualquer hora.'};
  if(has(ACORDA))return rest==='dormindo'?{mood:'surpreso',reply:'Hã? Ah, é você! Já tô acordado.'}:{mood:'feliz',reply:'Eu já tô acordado, olha só!'};
  if(has(/dorm|sono|boa noite|descansa/))return{mood:'dormindo',reply:'Tá bom... vou dormir um pouquinho. Boa noite... zzz'};
  if(has(/desculp|perdao|foi mal/)){const b=anger;anger=0;return b?{mood:'feliz',reply:'Hmm... tá bom, eu perdoo. Mas não faz mais isso, tá?'}:{mood:'feliz',reply:'Desculpa por quê? Eu nem fiquei bravo!'}}
  if(has(/\b(burr[oa]|idiota|imbecil|estupid[oa]|babaca|otari[oa]|trouxa|inutil|lixo|feio|feia|chat[oa]|bosta|merda|odeio|fdp|vtnc)\b|cala a boca/)){anger++;return{mood:'bravo',reply:anger>=3?'CHEGA! Só volto a falar com você quando pedir desculpa.':anger==2?'Eu tô ficando bravo de verdade, hein!':'Ei! Isso não foi legal.'}}
  if(anger>=3)return{mood:'bravo',reply:R(['Hmpf.','Não tô falando com você.','Peça desculpa primeiro.'])};
  if(has(/te amo|amo voce|fofo|fofinh|lindo|incrivel|parabens|o melhor/))return{mood:'amando',reply:R(['Aaah, para, eu fico todo vermelho!','Eu também gosto de você!'])};
  if(has(/piada/))return{mood:'rindo',reply:R(['Por que o computador foi ao médico? Porque estava com vírus!','O que o zero disse pro oito? Belo cinto!'])};
  if(has(/triste|chorando|sozinho|saudade/))return{mood:'triste',reply:'Poxa, sinto muito. Eu fico aqui com você.'};
  if(has(/kkk|haha|rsrs|engracad/))return{mood:'rindo',reply:'Hahaha! Agora eu também tô rindo!'};
  if(has(/\b(oi|ola|eae|opa|e ai)\b/))return{mood:'feliz',reply:R(['Oi! Que bom te ver por aqui!','Eaí! Eu tava te esperando.'])};
  if(has(/\?/))return{mood:'pensando',reply:'Hmmm... boa pergunta. Deixa eu pensar um pouco.'};
  return{mood:'feliz',reply:R(['Hmm, conta mais!','Entendi! Fala mais.','Haha, tá bom.'])};
}

async function ask(msg){
  const r=await fetch('/api/bup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,history:hist.slice(-10)}),signal:AbortSignal.timeout(25000)});
  if(!r.ok)throw 0;const d=await r.json();if(!d.reply)throw 0;return d;
}

async function send(txt){
  txt=txt.trim().slice(0,300);if(!txt||busy)return;busy=true;clearTimeout(idle);
  add('u',txt);inp.value='';
  const w=add('b','...');w.classList.add('dots');
  if(rest!=='dormindo')show('pensando');
  let out;
  if(rest==='dormindo'&&!ACORDA.test(n(txt)))out={mood:'dormindo',reply:R(['Zzz...','Zzz... mais cinco minutinhos...','(O Bup está dormindo. Diga "acorda" para chamar ele.)'])};
  else try{out=await ask(txt)}catch(e){out=local(txt)}
  if(!NOME[out.mood])out.mood='feliz';
  w.remove();set(out.mood);say(out.reply);
  hist.push({role:'user',content:txt},{role:'assistant',content:out.reply,mood:out.mood});hist=hist.slice(-12);
  idle=setTimeout(()=>{if(rest==='bravo'){anger=0;set('feliz');say('Já passou... mas não faz de novo.');hist.push({role:'assistant',content:'Já passou, não estou mais bravo.',mood:'feliz'})}},30000);
  busy=false;
}

$('#f').addEventListener('submit',e=>{e.preventDefault();send(inp.value)});
pet.addEventListener('click',()=>{
  if(busy)return;
  if(rest==='dormindo'){rest='feliz';clearTimeout(hold);show('bravo');hold=setTimeout(()=>show('feliz'),2500);say('Ei! Eu tava dormindo!');hist.push({role:'assistant',content:'Ei! Eu tava dormindo!',mood:'bravo'})}
  else if(rest==='bravo')say('Hmpf. Não encosta em mim.');
  else{set('rindo',2500);say(R(['Hihi, cócegas!','Para, eu tenho cócegas!']))}
});
show('feliz');say('Oi! Eu sou o Bup. Converse comigo e veja a minha cara mudar.');
})();
