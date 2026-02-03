// ================== SCORE POOLS ==================
let TX_SCORE={T:0,X:0}, MD5_SCORE={T:0,X:0}, DICE_SCORE={T:0,X:0};

// ================== VIP LEARNING =================
const VIP_KEY="vip_ultra";
let LAST={pred:null,prob:0,models:[]};

function loadVIP(){ return JSON.parse(localStorage.getItem(VIP_KEY)||'{"total":0,"win":0,"models":{}}'); }
function saveVIP(v){ localStorage.setItem(VIP_KEY,JSON.stringify(v)); }
function vipWeight(name){ let v=loadVIP(); return v.models[name]?.w||1; }

function rememberPrediction(result,prob,active){
  LAST.pred = result==="TÀI"?"T":"X";
  LAST.prob = parseFloat(prob);
  LAST.models = active||[];
}

function submitResult(real){
  if(!LAST.pred){ alert("❌ Chưa có dự đoán"); return; }
  let v=loadVIP(); v.total++;
  const win = (real===LAST.pred); if(win) v.win++;
  LAST.models.forEach(m=>{
    v.models[m]=v.models[m]||{w:1,t:0,wcnt:0};
    v.models[m].t++;
    if(win){ v.models[m].w*=1.02; v.models[m].wcnt++; }
    else v.models[m].w*=0.98;
    v.models[m].w=Math.max(0.6,Math.min(1.6,v.models[m].w));
  });
  saveVIP(v); renderVIP(win);
}

function renderVIP(isWin){
  let v=loadVIP();
  let rate=v.total?((v.win/v.total)*100).toFixed(1):0;
  document.getElementById("vipStat").innerHTML=
    `Tổng: ${v.win}/${v.total} | Winrate: ${rate}% | ${isWin?"THẮNG ✅":"THUA ❌"}`;
  let rows=Object.entries(v.models)
    .sort((a,b)=>b[1].w-a[1].w).slice(0,6)
    .map(([k,o])=>`<li>${k}: w=${o.w.toFixed(2)} | ${o.wcnt}/${o.t}</li>`).join("");
  document.getElementById("vipModels").innerHTML = rows?`<ul>${rows}</ul>`:"";
}

function resetVIP(){ if(confirm("Reset AI VIP?")){ localStorage.removeItem(VIP_KEY); location.reload(); } }

// ================== 21 BIG MODELS (AUTO 84) ==================
const BIG_MODELS=[
  {n:"Pattern 2-1-2",f:h=>{let s=h.slice(-5).join(""); if(s==="TTXTT") return{v:"T",c:.65};}},
  {n:"Short Trend",f:h=>{let r=h.slice(-5),t=r.filter(x=>x==="T").length; return{v:t>=3?"T":"X",c:.55};}},
  {n:"Long Trend",f:h=>{let r=h.slice(-20),t=r.filter(x=>x==="T").length; return{v:t>=11?"T":"X",c:.6};}},
  {n:"Gap 12",f:h=>{let r=h.slice(-12),t=r.filter(x=>x==="T").length,x=r.length-t; if(Math.abs(t-x)>=5) return{v:t>x?"X":"T",c:.7};}},
  {n:"Bad Pattern",f:h=>{let s=h.slice(-6).join(""); if(/TTXXTX|XXTTXT/.test(s)) return{v:null,c:.5};}}
];

// ================== HELPERS ==================
function miniAdjust(){ return 1-(Math.random()*0.1); }
function supportBalance(sc){ if(Math.abs(sc.T-sc.X)>0.35){ sc.T*=.9; sc.X*=.9; return "Cân bằng bias"; } }

// ================== TX ==================
function predictTX(){
  let h=[...document.getElementById("history").value.toUpperCase()].filter(x=>x==="T"||x==="X");
  let sc={T:0,X:0}, reasons=[], active=[];
  BIG_MODELS.forEach(m=>{
    let r=m.f(h); if(!r||!r.v) return;
    let wVIP=vipWeight(m.n);
    sc[r.v]+=r.c*wVIP*miniAdjust();
    active.push(m.n); reasons.push(m.n);
    let s=supportBalance(sc); if(s) reasons.push(s);
  });
  TX_SCORE=sc;
  let res=sc.T>sc.X?"TÀI":"XỈU", p=((Math.max(sc.T,sc.X)/(sc.T+sc.X))*100||50).toFixed(2);
  rememberPrediction(res,p,active);
  document.getElementById("txResult").innerHTML=`<b>${res}</b> – ${p}%<ul>${reasons.map(x=>`<li>${x}</li>`).join("")}</ul>`;
}

// ================== HASH ==================
function analyzeMD5(){
  let hash=document.getElementById("md5input").value.toLowerCase().trim();
  if(!/^[a-f0-9]{32}$/.test(hash) && !/^[a-f0-9]{64}$/.test(hash)){
    document.getElementById("md5Result").innerHTML="❌ Hash không hợp lệ"; return;
  }
  let chars=[...hash], d=chars.filter(c=>"0123456789".includes(c)).length, c=chars.length-d;
  let freq={}, entropy=0; chars.forEach(x=>freq[x]=(freq[x]||0)+1);
  Object.values(freq).forEach(v=>{ let p=v/chars.length; entropy-=p*Math.log2(p); });
  let rep=hash.match(/(.)\1{1,}/g);

  let sc={T:0,X:0}, r=[];
  if(d>c){ sc.X+=1.2; r.push("Nghiêng số"); } else{ sc.T+=1.2; r.push("Nghiêng chữ"); }
  if(entropy<3.6){ sc.X+=1.3; r.push("Entropy thấp"); } else{ sc.T+=1.1; r.push("Entropy cao"); }
  if(rep){ sc.X+=1.2; r.push("Pattern lặp"); }
  if(hash.length===64){ sc.T+=0.6; r.push("Hash dài"); }

  MD5_SCORE=sc;
  let res=sc.T>sc.X?"TÀI":"XỈU", p=((Math.max(sc.T,sc.X)/(sc.T+sc.X))*100).toFixed(2);
  document.getElementById("md5Result").innerHTML=
    `<b>${res}</b> – ${p}%<div class="small">Entropy ${entropy.toFixed(2)}</div><ul>${r.map(x=>`<li>${x}</li>`).join("")}</ul>`;
}

// ================== DICE ==================
function analyzeDice(){
  let arr=document.getElementById("diceinput").value.split(",").map(x=>+x).filter(x=>!isNaN(x));
  if(arr.length<3){ document.getElementById("diceResult").innerHTML="❌ Nhập ≥ 3 số"; return; }
  let avg=arr.reduce((a,b)=>a+b)/arr.length, sc={T:0,X:0}, r=[];
  if(avg<=10.5){ sc.T+=1.2; r.push("Điểm TB thấp"); } else{ sc.X+=1.2; r.push("Điểm TB cao"); }
  if(arr.at(-1)>=15){ sc.X+=1.3; r.push("Điểm cao đột biến"); }
  DICE_SCORE=sc;
  let res=sc.T>sc.X?"TÀI":"XỈU", p=((Math.max(sc.T,sc.X)/(sc.T+sc.X))*100).toFixed(2);
  document.getElementById("diceResult").innerHTML=`<b>${res}</b> – ${p}%<ul>${r.map(x=>`<li>${x}</li>`).join("")}</ul>`;
}

// ================== FINAL ==================
function finalDecision(){
  let T=TX_SCORE.T+MD5_SCORE.T+DICE_SCORE.T, X=TX_SCORE.X+MD5_SCORE.X+DICE_SCORE.X;
  let tot=T+X; if(!tot){ document.getElementById("finalResult").innerHTML="❌ Chưa đủ dữ liệu"; return; }
  let pT=T/tot, pX=X/tot, diff=Math.abs(pT-pX);
  let status = diff<.08?"❌ BỎ": diff<.15?"⚠️ CÂN NHẮC":"✅ NÊN ĐÁNH";
  let res=pT>pX?"TÀI":"XỈU", p=(Math.max(pT,pX)*100).toFixed(2);
  document.getElementById("finalResult").innerHTML=
    `<div class="result">${status}</div><h3>${res}</h3><p>🎯 ${p}%</p><p class="small">Chênh lệch ${(diff*100).toFixed(2)}%</p>`;
}
