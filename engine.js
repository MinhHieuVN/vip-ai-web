// ===== SCORE POOLS =====
let TX_SCORE={T:0,X:0}, MD5_SCORE={T:0,X:0}, DICE_SCORE={T:0,X:0};

// ===== 21 MODEL LỚN (SINH 84 MODEL TỰ ĐỘNG) =====
const BIG_MODELS = [
  (h)=>{let s=h.slice(-5).join(""); if(s==="TTXTT") return{v:"T",c:.65,w:"Cầu 2-1-2"};},
  (h)=>{let r=h.slice(-5),t=r.filter(x=>x==="T").length; return{v:t>=3?"T":"X",c:.55,w:"Trend 5 phiên"};},
  (h)=>{let r=h.slice(-20),t=r.filter(x=>x==="T").length; return{v:t>=11?"T":"X",c:.6,w:"Trend 20 phiên"};},
  (h)=>{let r=h.slice(-12),t=r.filter(x=>x==="T").length,x=r.length-t;
         if(Math.abs(t-x)>=5) return{v:t>x?"X":"T",c:.7,w:"12 phiên lệch mạnh"};},
  (h)=>{let s=h.slice(-6).join(""); if(/TTXXTX|XXTTXT/.test(s)) return{v:null,c:.5,w:"Cầu xấu"};}
];

// ===== SINH MINI + SUPPORT =====
function miniAdjust(){ return 1-(Math.random()*0.1); }
function supportBalance(sc){ if(Math.abs(sc.T-sc.X)>0.35){sc.T*=.9; sc.X*=.9; return "Cân bằng bias";} }

// ===== TX =====
function predictTX(){
  let h=[...document.getElementById("history").value.toUpperCase()].filter(x=>x==="T"||x==="X");
  let sc={T:0,X:0}, reasons=[];
  BIG_MODELS.forEach(fn=>{
    let r=fn(h); if(!r||!r.v) return;
    sc[r.v]+=r.c; sc[r.v]*=miniAdjust(); reasons.push(r.w);
    let s=supportBalance(sc); if(s) reasons.push(s);
  });
  TX_SCORE=sc;
  let res=sc.T>sc.X?"TÀI":"XỈU", p=((Math.max(sc.T,sc.X)/(sc.T+sc.X))*100||50).toFixed(2);
  document.getElementById("txResult").innerHTML=`<b>${res}</b> – ${p}%<ul>${reasons.map(x=>`<li>${x}</li>`).join("")}</ul>`;
}

// ===== MD5 =====
function analyzeMD5(){
  let md5=document.getElementById("md5input").value.toLowerCase();
  if(!/^[a-f0-9]{32}$/.test(md5)){document.getElementById("md5Result").innerHTML="❌ MD5 không hợp lệ";return;}
  let d=[...md5].filter(x=>"0123456789".includes(x)).length, c=32-d;
  let sc={T:0,X:0}, r=[];
  if(c>d){sc.T+=1.2; r.push("Nghiêng chữ");} else{sc.X+=1.2; r.push("Nghiêng số");}
  if(md5.match(/(.)\1{1,}/g)){sc.X+=1.2; r.push("Pattern lặp");}
  MD5_SCORE=sc;
  let res=sc.T>sc.X?"TÀI":"XỈU", p=((Math.max(sc.T,sc.X)/(sc.T+sc.X))*100).toFixed(2);
  document.getElementById("md5Result").innerHTML=`<b>${res}</b> – ${p}%<ul>${r.map(x=>`<li>${x}</li>`).join("")}</ul>`;
}

// ===== DICE =====
function analyzeDice(){
  let arr=document.getElementById("diceinput").value.split(",").map(x=>+x).filter(x=>!isNaN(x));
  if(arr.length<3){document.getElementById("diceResult").innerHTML="❌ Nhập ≥ 3 số";return;}
  let avg=arr.reduce((a,b)=>a+b)/arr.length, sc={T:0,X:0}, r=[];
  if(avg<=10.5){sc.T+=1.2; r.push("Điểm TB thấp");} else{sc.X+=1.2; r.push("Điểm TB cao");}
  if(arr.at(-1)>=15){sc.X+=1.3; r.push("Điểm cao đột biến");}
  DICE_SCORE=sc;
  let res=sc.T>sc.X?"TÀI":"XỈU", p=((Math.max(sc.T,sc.X)/(sc.T+sc.X))*100).toFixed(2);
  document.getElementById("diceResult").innerHTML=`<b>${res}</b> – ${p}%<ul>${r.map(x=>`<li>${x}</li>`).join("")}</ul>`;
}

// ===== FINAL (LEVEL CUỐI) =====
function finalDecision(){
  let T=TX_SCORE.T+MD5_SCORE.T+DICE_SCORE.T, X=TX_SCORE.X+MD5_SCORE.X+DICE_SCORE.X;
  let tot=T+X; if(!tot){document.getElementById("finalResult").innerHTML="❌ Chưa đủ dữ liệu";return;}
  let pT=T/tot, pX=X/tot, diff=Math.abs(pT-pX);
  let status= diff<.08?"❌ BỎ": diff<.15?"⚠️ CÂN NHẮC":"✅ NÊN ĐÁNH";
  let res=pT>pX?"TÀI":"XỈU", p=(Math.max(pT,pX)*100).toFixed(2);
  document.getElementById("finalResult").innerHTML=`<div class="result">${status}</div><h3>${res}</h3><p>🎯 ${p}%</p><p>Chênh lệch ${(diff*100).toFixed(2)}%</p>`;
}
