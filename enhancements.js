(function(){
"use strict";

/* SYSTEM v2.1 — lightweight enhancements
   Designed for older iPhones: vanilla JS, no libraries, minimal animation. */

function byId(id){ return document.getElementById(id); }

function addStyle(){
    var style=document.createElement("style");
    style.id="system-v21-style";
    style.textContent=
        ".sysNext{margin-top:10px;padding:11px;border:1px solid #26345f;border-radius:9px;background:#0b1022}"+
        ".sysNextTitle{font-size:10px;letter-spacing:2px;color:#8497ff;margin-bottom:5px}"+
        ".sysNextText{font-size:13px;color:#edf1ff;line-height:1.4}"+
        ".sysNextMeta{font-size:10px;color:#7f89aa;margin-top:4px}"+
        ".sysFlash{animation:sysFlash .28s ease-out}"+
        "@keyframes sysFlash{0%{opacity:.55;transform:scale(.99)}100%{opacity:1;transform:scale(1)}}"+
        "@media(max-width:550px){.panel{padding:12px}.actions button{min-height:38px}.nav button{min-height:42px}.quickadd{width:50px;height:50px}}";
    document.head.appendChild(style);
}

function getText(el){
    return el ? (el.textContent || "").replace(/\s+/g," ").trim() : "";
}

function updateNextObjective(){
    var home=byId("home");
    var today=byId("todayQuests");
    if(!home || !today) return;

    var old=byId("systemNextObjective");
    if(old) old.parentNode.removeChild(old);

    var items=today.querySelectorAll(".item");
    var next=null;
    var i;
    for(i=0;i<items.length;i++){
        if((items[i].className||"").indexOf("done")===-1){
            next=items[i];
            break;
        }
    }

    var box=document.createElement("div");
    box.id="systemNextObjective";
    box.className="sysNext";

    var title=document.createElement("div");
    title.className="sysNextTitle";
    title.textContent="NEXT OBJECTIVE";
    box.appendChild(title);

    var text=document.createElement("div");
    text.className="sysNextText";

    var meta=document.createElement("div");
    meta.className="sysNextMeta";

    if(next){
        text.textContent=getText(next.querySelector("h3")) || getText(next).slice(0,100) || "Complete the next quest.";
        meta.textContent="Focus on one task. Then return to the SYSTEM.";
    }else{
        text.textContent="All visible daily quests complete.";
        meta.textContent="SYSTEM STATUS: DAY CLEARED ✓";
    }

    box.appendChild(text);
    box.appendChild(meta);

    var random=home.querySelector(".panel.center");
    if(random && random.parentNode){
        random.parentNode.insertBefore(box,random);
    }
}

function watchChanges(){
    var today=byId("todayQuests");
    if(!today || !window.MutationObserver) return;
    var timer=null;
    var observer=new MutationObserver(function(){
        if(timer) clearTimeout(timer);
        timer=setTimeout(updateNextObjective,60);
    });
    observer.observe(today,{childList:true,subtree:true,characterData:true,attributes:true});
}

function watchLevel(){
    var level=byId("homeLevel");
    if(!level || !window.MutationObserver) return;
    var last=getText(level);
    var observer=new MutationObserver(function(){
        var now=getText(level);
        if(now && now!==last){
            last=now;
            level.className="sysFlash";
            setTimeout(function(){level.className="";},350);
            if(typeof window.toast==="function"){
                try{ window.toast("LEVEL UP → LVL "+now,"level"); }catch(e){}
            }
        }
    });
    observer.observe(level,{childList:true,characterData:true,subtree:true});
}

function init(){
    addStyle();
    updateNextObjective();
    watchChanges();
    watchLevel();
}

if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",init);
}else{
    init();
}

})();
