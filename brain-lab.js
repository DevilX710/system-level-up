(function(){
"use strict";

/*
 * SYSTEM // AWAKENING — BRAIN LAB
 * Lightweight brain-training module for older iPhones.
 * No libraries. No network. iOS 12 friendly.
 */

var BL_KEY="systemBrainLab_v1";
var bl={
  xp:0, best:0, sessions:0, streak:0, lastDay:"",
  played:{reaction:0,memory:0,math:0,pattern:0,focus:0}
};
var blGame=null, blTimer=null, blStart=0, blSeq=[], blSeqIndex=0, blRound=0, blSessionScore=0, blLevel=1;

function blDifficulty(){ blLevel=1+Math.floor(bl.xp/500); return Math.min(5,blLevel); }\nfunction blLoad(){
  try{
    var raw=localStorage.getItem(BL_KEY);
    if(raw){
      var saved=JSON.parse(raw);
      for(var k in bl) if(saved[k]!==undefined) bl[k]=saved[k];
    }
  }catch(e){}
  blDay();
}
function blSave(){
  try{localStorage.setItem(BL_KEY,JSON.stringify(bl));}catch(e){}
}
function blDay(){
  var d=new Date();
  var key=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  if(bl.lastDay && bl.lastDay!==key){
    var prev=new Date();
    prev.setDate(prev.getDate()-1);
    var pk=prev.getFullYear()+"-"+String(prev.getMonth()+1).padStart(2,"0")+"-"+String(prev.getDate()).padStart(2,"0");
    if(bl.lastDay!==pk) bl.streak=0;
  }
}
function blTodayKey(){
  var d=new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
function blStartSession(){
  blRound=0; blSessionScore=0;
  blRenderGame();
  blNextRound();
}
function blNextRound(){
  blClearTimer();
  blRound++;
  if(blRound>5){ blFinishSession(); return; }
  var games=["reaction","memory","math","pattern","focus"];
  var game=games[(blRound-1)%games.length];
  blStartGame(game);
}
function blStartGame(game){
  blGame=game;
  var host=document.getElementById("brainGame");
  if(!host)return;
  if(game==="reaction") blReaction(host);
  if(game==="memory") blMemory(host);
  if(game==="math") blMath(host);
  if(game==="pattern") blPattern(host);
  if(game==="focus") blFocus(host);
}
function blRenderGame(){
  var host=document.getElementById("brainGame");
  if(host)host.innerHTML='<div class="blIntro"><div class="blKicker">TRAINING RUN</div><div class="blRunScore" id="blRunScore">0 XP</div><div class="blRound" id="blRound">ROUND 1 / 5</div></div>';
}
function blHeader(title,instruction){
  var host=document.getElementById("brainGame");
  host.innerHTML=
    '<div class="blGameHead"><div><div class="blKicker">'+title+'</div><div class="blInstruction">'+instruction+'</div></div>'+
    '<div class="blMiniRound">'+blRound+'/5</div></div>'+
    '<div id="blGameArea" class="blGameArea"></div>';
  return document.getElementById("blGameArea");
}
function blReaction(host){
  var area=blHeader("REACTION","Tap when the signal turns green.");
  area.innerHTML='<button id="blReact" class="blReact wait">WAIT...</button><div class="blHint">False tap = round lost.</div>';
  var btn=document.getElementById("blReact");
  var ready=false, done=false;
  var difficulty=blDifficulty();\n  var delay=Math.max(650,2400-(difficulty*180))+Math.floor(Math.random()*1200);
  btn.onclick=function(){
    if(done)return;
    if(!ready){
      blScore(0,"TOO EARLY");
      done=true;
      btn.className="blReact bad"; btn.innerHTML="TOO EARLY";
      blAfter(700); return;
    }
    done=true;
    var ms=Date.now()-blStart;
    var pts=Math.max(10,Math.round(100-(ms/8)));
    blScore(pts,ms+" MS");
    btn.className="blReact good"; btn.innerHTML=ms+" MS";
    blAfter(850);
  };
  blTimer=setTimeout(function(){
    if(done)return;
    ready=true; blStart=Date.now();
    btn.className="blReact go"; btn.innerHTML="TAP!";
  },delay);
}
function blMemory(host){
  var area=blHeader("MEMORY","Remember the sequence, then repeat it.");
  blSeq=[]; blSeqIndex=0;
  var len=3+Math.min(3,Math.floor((blRound-1)/2))+Math.min(1,Math.floor(blDifficulty()/3));
  for(var i=0;i<len;i++)blSeq.push(Math.floor(Math.random()*4));
  area.innerHTML='<div class="blSequence" id="blSequence">WATCH</div><div class="blPad" id="blPad"></div><div class="blHint">Sequence length: '+len+'</div>';
  var pad=document.getElementById("blPad");
  for(i=0;i<4;i++){
    var b=document.createElement("button");
    b.className="blPadBtn"; b.setAttribute("data-n",i); b.innerHTML=(i+1);
    b.onclick=function(){ blMemoryTap(Number(this.getAttribute("data-n"))); };
    pad.appendChild(b);
  }
  var idx=0;
  function showNext(){
    var s=document.getElementById("blSequence");
    if(!s)return;
    if(idx>=blSeq.length){
      s.innerHTML="YOUR TURN"; s.className="blSequence ready"; return;
    }
    s.innerHTML=(blSeq[idx]+1); s.className="blSequence flash";
    idx++;
    blTimer=setTimeout(function(){s.className="blSequence";s.innerHTML="•";blTimer=setTimeout(showNext,260);},480);
  }
  blTimer=setTimeout(showNext,500);
}
function blMemoryTap(n){
  var s=document.getElementById("blSequence");
  if(!s)return;
  if(n!==blSeq[blSeqIndex]){
    s.className="blSequence bad"; s.innerHTML="MISS";
    blScore(0,"MEMORY LOST"); blAfter(750); return;
  }
  blSeqIndex++;
  s.innerHTML="✓ "+blSeqIndex+"/"+blSeq.length;
  if(blSeqIndex>=blSeq.length){
    var pts=55+blSeq.length*12;
    s.className="blSequence good"; s.innerHTML="MEMORY LOCKED";
    blScore(pts,"+"+pts+" XP"); blAfter(850);
  }
}
function blMath(host){
  var area=blHeader("QUICK MATH","Solve before the clock beats you.");
  var a=5+Math.floor(Math.random()*16), b=2+Math.floor(Math.random()*12);
  var op=Math.random()<.5?"+":"×", ans=op==="+"?a+b:a*b;
  var choices=[ans];
  while(choices.length<4){
    var c=ans+(Math.floor(Math.random()*11)-5);
    if(c>0 && choices.indexOf(c)<0)choices.push(c);
  }
  choices.sort(function(){return Math.random()-.5;});
  area.innerHTML='<div class="blEquation">'+a+" "+op+" "+b+' = ?</div><div class="blChoices" id="blChoices"></div><div class="blHint">One answer. No calculator.</div>';
  var box=document.getElementById("blChoices");
  for(var i=0;i<choices.length;i++){
    var bt=document.createElement("button");
    bt.className="blChoice"; bt.innerHTML=choices[i];
    bt.setAttribute("data-answer",choices[i]);
    bt.onclick=function(){
      var value=Number(this.getAttribute("data-answer"));
      if(value===ans){
        blScore(60,"CORRECT"); this.className="blChoice good";
      }else{
        blScore(0,"WRONG"); this.className="blChoice bad";
      }
      blAfter(650);
    };
    box.appendChild(bt);
  }
}
function blPattern(host){
  var area=blHeader("PATTERN","Find what comes next.");
  var start=2+Math.floor(Math.random()*7), step=2+Math.floor(Math.random()*5);
  var seq=[start,start+step,start+step*2,start+step*3];
  var ans=start+step*4, choices=[ans,ans+step,ans-step,ans+2];
  choices.sort(function(){return Math.random()-.5;});
  area.innerHTML='<div class="blPattern">'+seq.join("  ·  ")+'  ·  <b>?</b></div><div class="blChoices" id="blChoices"></div><div class="blHint">Look for the hidden rule.</div>';
  var box=document.getElementById("blChoices");
  for(var i=0;i<choices.length;i++){
    var bt=document.createElement("button");
    bt.className="blChoice"; bt.innerHTML=choices[i]; bt.setAttribute("data-answer",choices[i]);
    bt.onclick=function(){
      if(Number(this.getAttribute("data-answer"))===ans){this.className="blChoice good";blScore(65,"PATTERN SOLVED");}
      else{this.className="blChoice bad";blScore(0,"PATTERN MISSED");}
      blAfter(700);
    };
    box.appendChild(bt);
  }
}
function blFocus(host){
  var area=blHeader("FOCUS GRID","Tap the symbol that appears only once.");
  var symbols=["◆","●","▲","■"], odd=symbols[Math.floor(Math.random()*symbols.length)];
  var normal=symbols[(symbols.indexOf(odd)+1)%symbols.length];
  var oddPos=Math.floor(Math.random()*12), html="";
  for(var i=0;i<12;i++) html+='<button class="blFocusBtn" data-odd="'+(i===oddPos?'1':'0')+'">'+(i===oddPos?odd:normal)+'</button>';
  area.innerHTML='<div class="blFocusGrid">'+html+'</div><div class="blHint">One tap. Stay locked in.</div>';
  var buttons=area.querySelectorAll(".blFocusBtn");
  for(var j=0;j<buttons.length;j++){
    buttons[j].onclick=function(){
      if(this.getAttribute("data-odd")==="1"){this.className="blFocusBtn good";blScore(55,"FOCUS HIT");}
      else{this.className="blFocusBtn bad";blScore(0,"DISTRACTED");}
      blAfter(700);
    };
  }
}
function blScore(points,label){
  blSessionScore+=points;
  var run=document.getElementById("blRunScore");
  if(run)run.innerHTML=blSessionScore+" XP";
  var area=document.getElementById("blGameArea");
  if(area){
    var tag=document.createElement("div");
    tag.className="blResult "+(points?"good":"bad");
    tag.innerHTML=label;
    area.appendChild(tag);
  }
}
function blAfter(ms){
  blClearTimer();
  blTimer=setTimeout(blNextRound,ms);
}
function blClearTimer(){
  if(blTimer){clearTimeout(blTimer);blTimer=null;}
}
function blFinishSession(){
  blClearTimer();
  var today=blTodayKey();
  if(bl.lastDay!==today){
    var prev=new Date(); prev.setDate(prev.getDate()-1);
    var pk=prev.getFullYear()+"-"+String(prev.getMonth()+1).padStart(2,"0")+"-"+String(prev.getDate()).padStart(2,"0");
    bl.streak=(bl.lastDay===pk)?bl.streak+1:1;
    bl.lastDay=today;
  }
  bl.sessions++;
  bl.xp+=blSessionScore;
  if(blSessionScore>bl.best)bl.best=blSessionScore;
  blSave();
  var host=document.getElementById("brainGame");
  if(host)host.innerHTML=
    '<div class="blComplete"><div class="blKicker">RUN COMPLETE</div><div class="blFinal">'+blSessionScore+' XP</div>'+
    '<div class="blCompleteMeta">BEST '+bl.best+' · STREAK '+bl.streak+'</div>'+
    '<button class="primary blWide" onclick="brainStart()">RUN AGAIN</button>'+
    '<button class="blWide" onclick="brainHome()">RETURN TO BRAIN LAB</button></div>';
  blUpdateStats();
}
function blUpdateStats(){
  var ids={blXP:bl.xp,blBest:bl.best,blSessions:bl.sessions,blStreak:bl.streak,blLevel:blDifficulty()};
  for(var k in ids){var el=document.getElementById(k);if(el)el.innerHTML=ids[k];}
}
function brainStart(){blStartSession();}
function brainHome(){
  blClearTimer(); blGame=null; blSessionScore=0;
  var host=document.getElementById("brainGame");
  if(host)host.innerHTML='<div class="blEmpty"><div class="blKicker">READY</div><div class="blEmptyTitle">Train your brain.</div><div class="muted">Five quick rounds. No accounts. No network.</div><button class="primary blWide" onclick="brainStart()">START TRAINING</button></div>';
  blUpdateStats();
}
function brainOpenGame(name){
  blRound=1; blSessionScore=0; blRenderGame(); blStartGame(name);
}
function brainRender(){
  if(!document.getElementById("brainLab"))return;
  blLoad(); blUpdateStats(); brainHome();
}
function brainInject(){
  if(document.getElementById("brainLab"))return;
  var section=document.createElement("section");
  section.id="brainLab"; section.className="tab";
  section.innerHTML=
    '<div class="panel blHero"><div class="system">SYSTEM // COGNITIVE MODULE</div><h2>🧠 BRAIN LAB</h2>'+
    '<p class="muted">Quick training rounds for reaction, memory, math, patterns and focus.</p>'+
    '<div class="blStats">'+
      '<div><span>XP</span><b id="blXP">0</b></div><div><span>BEST</span><b id="blBest">0</b></div>'+
      '<div><span>RUNS</span><b id="blSessions">0</b></div><div><span>STREAK</span><b id="blStreak">0</b></div><div><span>LEVEL</span><b id="blLevel">1</b></div>'+
    '</div><button class="primary blWide" onclick="brainStart()">⚡ START 5-ROUND RUN</button></div>'+
    '<div class="panel" id="brainGame"></div>'+
    '<div class="panel"><div class="finance-section-title"><span>🧩 QUICK GAMES</span><span class="muted">1 ROUND</span></div>'+
      '<div class="blGameList">'+
        '<button onclick="brainOpenGame(\'reaction\')">⚡<b>Reaction</b><small>Speed</small></button>'+
        '<button onclick="brainOpenGame(\'memory\')">🧠<b>Memory</b><small>Recall</small></button>'+
        '<button onclick="brainOpenGame(\'math\')">➗<b>Math</b><small>Speed</small></button>'+
        '<button onclick="brainOpenGame(\'pattern\')">🔷<b>Pattern</b><small>Logic</small></button>'+
        '<button onclick="brainOpenGame(\'focus\')">🎯<b>Focus</b><small>Accuracy</small></button>'+
      '</div></div>'+
    '<div class="panel"><div class="muted">BRAIN LAB // DESIGN NOTE</div><p class="muted">Original SYSTEM // AWAKENING games and UI, built for short touch sessions and older Safari.</p></div>';
  var app=document.getElementById("app");
  var nav=document.querySelector(".nav");
  if(app)app.appendChild(section);
  var style=document.createElement("style");
  style.textContent=
    "#brainLab .blHero{border-color:#33447a;background:linear-gradient(145deg,#090d20,#070a16)}"+
    ".blStats{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin:14px 0}"+
    ".blStats>div{background:#0b1022;border:1px solid #26345f;border-radius:9px;padding:8px;text-align:center}"+
    ".blStats span{display:block;font-size:9px;color:#8e9ac0;letter-spacing:1px}.blStats b{display:block;font-size:18px;margin-top:3px}"+
    ".blWide{width:100%;margin-top:8px;min-height:42px}"+
    ".blGameHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.blKicker{font-size:9px;letter-spacing:2px;color:#8497ff;margin-bottom:5px}.blInstruction{font-size:14px;font-weight:700}.blMiniRound{font-size:10px;color:#aebaff;border:1px solid #334276;border-radius:999px;padding:5px 7px}"+
    ".blGameArea{text-align:center;min-height:230px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 0}.blHint{font-size:10px;color:#8994b8;margin-top:12px}.blReact{width:100%;height:180px;border-radius:14px;font-size:25px;font-weight:800;letter-spacing:2px}.blReact.wait{background:#11172f}.blReact.go{background:#214d3a;border-color:#78e9a4;color:#baffd4}.blReact.bad{background:#3a1822;border-color:#ff8798;color:#ffb4bd}.blReact.good{background:#122f25;border-color:#78e9a4;color:#baffd4}"+
    ".blSequence{font-size:48px;font-weight:800;height:85px;display:flex;align-items:center;justify-content:center}.blSequence.flash{color:#b9c5ff;text-shadow:0 0 18px #536cff}.blSequence.ready{color:#78e9a4}.blSequence.bad{color:#ff8798}.blSequence.good{color:#78e9a4}.blPad,.blChoices{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;width:100%;max-width:360px}.blPadBtn,.blChoice{min-height:52px;font-size:17px}.blEquation{font-size:34px;font-weight:800;margin-bottom:18px}.blPattern{font-size:22px;font-weight:700;letter-spacing:1px;margin-bottom:22px}.blFocusGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;width:100%;max-width:360px}.blFocusBtn{height:58px;font-size:25px}.blResult{margin-top:10px;font-size:11px;letter-spacing:1.5px}.blResult.good{color:#78e9a4}.blResult.bad{color:#ff8798}.blComplete{text-align:center;padding:24px 8px}.blFinal{font-size:54px;font-weight:800;margin:12px 0}.blCompleteMeta{font-size:11px;color:#aebaff;letter-spacing:1.5px}.blEmpty{text-align:center;padding:24px 8px}.blEmptyTitle{font-size:22px;font-weight:800;margin:5px 0 7px}.blGameList{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.blGameList button{padding:10px 5px;min-height:70px}.blGameList b,.blGameList small{display:block}.blGameList b{font-size:10px;margin-top:4px}.blGameList small{font-size:8px;margin-top:2px}@media(max-width:550px){.blStats{grid-template-columns:repeat(5,1fr)}.blGameList{grid-template-columns:repeat(3,1fr)}.blEquation{font-size:29px}.blReact{height:160px}}";
  document.head.appendChild(style);

  var more=document.querySelector(".nav button:last-child");
  if(more && typeof window.moreMenu==="function"){
    var old=window.moreMenu;
    window.moreMenu=function(){
      openModal("MORE SYSTEMS",
        '<button class="primary" onclick="tabFromMore(\'brainLab\')">🧠 Brain Lab</button><br><br>'+
        '<button onclick="tabFromMore(\'inventory\')">🎒 Inventory</button><br><br>'+
        '<button onclick="tabFromMore(\'budget\')">💰 Budget</button><br><br>'+
        '<button onclick="tabFromMore(\'notes\')">📝 Notes</button><br><br>'+
        '<button onclick="tabFromMore(\'calendar\')">📅 Calendar</button><br><br>'+
        '<button onclick="tabFromMore(\'analytics\')">📊 Analytics</button><br><br>'+
        '<button onclick="tabFromMore(\'settingsTab\')">⚙️ Settings</button>'
      );
    };
  }
}
function brainInit(){
  brainInject();
  blLoad();
  brainRender();
}
window.brainStart=brainStart;
window.brainHome=brainHome;
window.brainOpenGame=brainOpenGame;
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",brainInit);
else brainInit();
})();