(() => {
  'use strict';
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const veil = document.querySelector('#veil');
  const panelTitle = document.querySelector('#panelTitle');
  const panelText = document.querySelector('#panelText');
  const panelEyebrow = document.querySelector('#panelEyebrow');
  const startButton = document.querySelector('#startButton');
  const toast = document.querySelector('#toast');
  const W = 960, H = 600;
  const names = ['THE ASHEN SENTINEL', 'THE GLOAM WYRM', 'THE HOLLOW KING'];
  let state = 'menu', last = 0, time = 0, distance = 0, stage = 0, boss = null;
  let hazards = [], shots = [], enemyShots = [], particles = [];
  let soundOn = true, audio = null, toastTimer = 0, shake = 0;
  let player = {x:220,y:300,vy:0,hp:3,iframes:0,flap:0,attack:0};
  let nextHazard = 530;
  const rand = (a,b) => a + Math.random()*(b-a);
  const caveTop = x => 72 + Math.sin(x*.0031)*25 + Math.sin(x*.0083+1.6)*11 + Math.sin(x*.0014)*15;
  const caveBottom = x => 526 + Math.sin(x*.0027+1.1)*25 + Math.sin(x*.0071)*13 + Math.sin(x*.0016+2)*12;
  function beep(freq=440,duration=.08,type='sine',volume=.035){
    if(!soundOn)return;
    try{audio ||= new (window.AudioContext||window.webkitAudioContext)(); if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch(_){ }
  }
  function announce(text){toast.textContent=text;toast.classList.add('show');toastTimer=2.2}
  function reset(){
    state='playing';distance=0;stage=0;boss=null;hazards=[];shots=[];enemyShots=[];particles=[];nextHazard=480;shake=0;
    player={x:220,y:300,vy:0,hp:3,iframes:0,flap:0,attack:0}; veil.classList.add('hidden'); announce('DESCEND INTO THE DARK');
  }
  function endGame(win){
    state=win?'won':'dead';veil.classList.remove('hidden');
    panelEyebrow.textContent=win?'THE DEEP REMEMBERS':'YOUR LIGHT FADES';
    panelTitle.innerHTML=win?'THE HOLLOW<br><em>IS SILENT</em>':'YOU HAVE<br><em>FALLEN</em>';
    panelText.textContent=win?'The three wardens are no more. Against all odds, you carried a spark through the dark. The abyss releases you.':`You reached ${Math.floor(distance/10)} fathoms and felled ${stage} of 3 wardens. The cave keeps what it takes.`;
    startButton.innerHTML=win?'DESCEND AGAIN <span>↻</span>':'RISE AGAIN <span>↻</span>';
  }
  function flap(){if(state!=='playing')return;player.vy=-410;player.flap=.22;beep(350,.075,'triangle',.028);for(let i=0;i<3;i++)particles.push({x:player.x-17,y:player.y+rand(-6,8),vx:rand(-80,-20),vy:rand(-50,50),life:.35,color:'#d4a967',r:rand(1,3)})}
  function strike(){if(state!=='playing'||player.attack>0)return;player.attack=.28;shots.push({x:player.x+25,y:player.y-1,vx:610,life:1.55});beep(690,.07,'sawtooth',.018)}
  function startBoss(){boss={x:760,y:300,hp:100,max:100,attackTimer:1.25,phase:0,flash:0};announce(names[stage]);beep(110,.6,'sawtooth',.06);shake=8}
  function damagePlayer(){if(player.iframes>0)return;player.hp--;player.iframes=1.15;player.vy=-200;shake=10;beep(95,.25,'sawtooth',.07);for(let i=0;i<14;i++)particles.push({x:player.x,y:player.y,vx:rand(-140,140),vy:rand(-150,150),life:rand(.3,.7),color:'#e18165',r:rand(2,5)});if(player.hp<=0)endGame(false)}
  function addHazards(){while(nextHazard<distance+W+300){const worldX=nextHazard;const mid=rand(255,370),gap=rand(166,198);hazards.push({x:worldX,mid,gap,w:rand(52,76),seed:Math.random()});nextHazard+=rand(390,520)}}
  function hitBox(a,b,pad=0){return a.x+pad<b.x+b.w&&a.x+a.w-pad>b.x&&a.y+pad<b.y+b.h&&a.y+a.h-pad>b.y}
  function update(dt){
    time+=dt;if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)toast.classList.remove('show')}
    if(state!=='playing')return;
    dt=Math.min(dt,.035);player.vy=Math.min(500,player.vy+840*dt);player.y+=player.vy*dt;player.flap=Math.max(0,player.flap-dt);player.attack=Math.max(0,player.attack-dt);player.iframes=Math.max(0,player.iframes-dt);shake=Math.max(0,shake-28*dt);
    if(!boss){distance+=145*dt;addHazards();if(stage<3&&distance>=[1120,2570,4050][stage])startBoss()}
    else{boss.phase+=dt;boss.y=300+Math.sin(boss.phase*1.35+stage)*84;boss.x=760+Math.sin(boss.phase*.65)*24;boss.flash=Math.max(0,boss.flash-dt);boss.attackTimer-=dt;if(boss.attackTimer<=0){const count=stage===2?3:stage===1?2:1;for(let i=0;i<count;i++){const spread=(i-(count-1)/2)*.24;const dx=player.x-boss.x,dy=player.y-boss.y;const angle=Math.atan2(dy,dx)+spread;const speed=stage===2?270:235;enemyShots.push({x:boss.x-42,y:boss.y+12,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:3,r:stage===2?8:7})}boss.attackTimer=stage===0?1.8:stage===1?1.45:1.18;beep(155,.16,'triangle',.025)}}
    const pbox={x:player.x-13,y:player.y-13,w:27,h:27};
    if(player.y< caveTop(distance+player.x)+11 || player.y>caveBottom(distance+player.x)-12)damagePlayer();
    if(!boss){for(const h of hazards){const sx=h.x-distance;if(sx<-100||sx>W+100)continue;const upperEnd=h.mid-h.gap/2,lowerStart=h.mid+h.gap/2;const rockTop={x:sx,y:caveTop(h.x)-5,w:h.w,h:upperEnd-caveTop(h.x)+10};const rockBot={x:sx,y:lowerStart,w:h.w,h:caveBottom(h.x)-lowerStart+10};if(hitBox(pbox,rockTop,4)||hitBox(pbox,rockBot,4))damagePlayer()}}
    for(const s of shots){s.x+=s.vx*dt;s.life-=dt;if(boss&&s.x>boss.x-70&&s.x<boss.x+50&&Math.abs(s.y-boss.y)<82){boss.hp-=12;boss.flash=.12;s.life=0;beep(260,.05,'square',.025);for(let i=0;i<5;i++)particles.push({x:s.x,y:s.y,vx:rand(-100,50),vy:rand(-90,90),life:.28,color:'#f3bf72',r:rand(2,4)});if(boss.hp<=0){stage++;boss=null;enemyShots=[];announce(stage===3?'THE HOLLOW KING HAS FALLEN':'WARDEN VANQUISHED  ·  DESCEND');beep(520,.4,'sine',.055);shake=8;if(stage===3){setTimeout(()=>endGame(true),1100)}}}}
    shots=shots.filter(s=>s.life>0&&s.x<W+80);
    for(const s of enemyShots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(hitBox(pbox,{x:s.x-s.r,y:s.y-s.r,w:s.r*2,h:s.r*2},2)){damagePlayer();s.life=0}}
    enemyShots=enemyShots.filter(s=>s.life>0&&s.x>-50&&s.x<W+50&&s.y>-50&&s.y<H+50);
    if(player.iframes<=0 && state==='playing' && boss&&Math.abs(player.x-boss.x)<68&&Math.abs(player.y-boss.y)<65)damagePlayer();
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.98;p.vy*=.98;p.life-=dt}particles=particles.filter(p=>p.life>0);
    if(player.y>H+30||player.y<-30)damagePlayer();
    hazards=hazards.filter(h=>h.x-distance>-130);
  }
  function pathRoundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
  function drawBackground(){
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#101922');sky.addColorStop(.55,'#171b1b');sky.addColorStop(1,'#0d1217');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    // distant mineral glints
    for(let i=0;i<70;i++){const x=((i*173-distance*.16)%1100+1100)%1100-60;const y=(i*97%440)+65;const flick=.25+.45*(.5+.5*Math.sin(time*1.7+i*3));ctx.fillStyle=`rgba(202,167,111,${flick})`;ctx.fillRect(x,y,1.4,1.4)}
    // far cave ribs
    ctx.strokeStyle='#87909a12';ctx.lineWidth=2;for(let i=0;i<9;i++){const x=(i*160-distance*.3%160);ctx.beginPath();ctx.moveTo(x,0);ctx.quadraticCurveTo(x-70,130,x+5,245);ctx.stroke()}
    // cavern walls follow the flight path
    ctx.beginPath();ctx.moveTo(0,0);for(let x=0;x<=W;x+=12)ctx.lineTo(x,caveTop(distance+x));ctx.lineTo(W,0);ctx.closePath();const top=ctx.createLinearGradient(0,0,0,170);top.addColorStop(0,'#080b0f');top.addColorStop(1,'#34302a');ctx.fillStyle=top;ctx.fill();
    ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W;x+=12)ctx.lineTo(x,caveBottom(distance+x));ctx.lineTo(W,H);ctx.closePath();const bottom=ctx.createLinearGradient(0,440,0,H);bottom.addColorStop(0,'#39322a');bottom.addColorStop(1,'#090d12');ctx.fillStyle=bottom;ctx.fill();
    // luminous seams at the cave edges
    ctx.strokeStyle='#c19a5c55';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<=W;x+=12){const y=caveTop(distance+x)+2;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();ctx.beginPath();for(let x=0;x<=W;x+=12){const y=caveBottom(distance+x)-2;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
    // jagged cave teeth
    for(let i=0;i<30;i++){const x=(i*47-distance*.45%1410+1410)%1010-20;const y=caveTop(distance+x);const tooth=10+((i*17)%11);ctx.fillStyle=i%3?'#24231f':'#342d24';ctx.beginPath();ctx.moveTo(x-9,y);ctx.lineTo(x+2,y+tooth);ctx.lineTo(x+12,y);ctx.fill();const by=caveBottom(distance+x);ctx.beginPath();ctx.moveTo(x-9,by);ctx.lineTo(x+2,by-tooth*.85);ctx.lineTo(x+12,by);ctx.fill()}
  }
  function drawHazards(){for(const h of hazards){const x=h.x-distance;if(x<-90||x>W+90)continue;const topY=caveTop(h.x),botY=caveBottom(h.x),topEnd=h.mid-h.gap/2,botStart=h.mid+h.gap/2;rock(x,topY,h.w,topEnd-topY,true,h.seed);rock(x,botStart,h.w,botY-botStart,false,h.seed)}}
  function rock(x,y,w,h,top,seed){ctx.save();ctx.fillStyle='#25231f';ctx.strokeStyle='#63513a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w*.15,y+ (top?0:8));ctx.lineTo(x+w*.27,y+h*.14);ctx.lineTo(x+w*.48,y+h*.10);ctx.lineTo(x+w*.68,y+h*.21);ctx.lineTo(x+w*.84,y+h*.14);ctx.lineTo(x+w,y+(top?0:7));ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#af8a52';for(let i=0;i<4;i++){const gx=x+((seed*100+i*29)%w);const gy=top?y+h-4-i%2*4:y+4+i%2*3;ctx.globalAlpha=.5;ctx.fillRect(gx,gy,2,2)}ctx.restore()}
  function drawPlayer(){ctx.save();ctx.translate(player.x,player.y);ctx.rotate(Math.max(-.35,Math.min(.5,player.vy/850)));if(player.iframes>0&&Math.floor(time*16)%2)ctx.globalAlpha=.35;
    // ember wake
    const glow=ctx.createRadialGradient(-13,0,1,0,0,38);glow.addColorStop(0,'#d7984f3d');glow.addColorStop(1,'#d7984f00');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,38,0,Math.PI*2);ctx.fill();
    // little torn cloak
    ctx.fillStyle='#794c32';ctx.beginPath();ctx.moveTo(-7,1);ctx.lineTo(-27,13);ctx.lineTo(-18,1);ctx.lineTo(-30,-6);ctx.lineTo(-7,-8);ctx.closePath();ctx.fill();
    // wings / mantle
    ctx.fillStyle='#9f7950';ctx.beginPath();ctx.ellipse(-5,player.flap? -12: -8,12,player.flap?10:5,-.35,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d2a35d';ctx.beginPath();ctx.ellipse(-7,player.flap? -17:-10,7,player.flap?5:2,-.4,0,Math.PI*2);ctx.fill();
    // body and iron helm
    ctx.fillStyle='#bd9c6e';ctx.beginPath();ctx.ellipse(1,2,14,11,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#68727a';ctx.beginPath();ctx.arc(7,-3,10,Math.PI*1.05,Math.PI*2.08);ctx.lineTo(17,-1);ctx.lineTo(6,5);ctx.closePath();ctx.fill();ctx.strokeStyle='#b9b5a6';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#f0c77c';ctx.fillRect(10,-2,4,2);ctx.fillStyle='#e7e0d1';ctx.fillRect(14,3,13,2);ctx.fillStyle='#9b7447';ctx.fillRect(-2,8,7,3);ctx.restore()}
  function drawBoss(){if(!boss)return;ctx.save();ctx.translate(boss.x,boss.y);const n=stage;const aura=ctx.createRadialGradient(0,0,20,0,0,125);aura.addColorStop(0,n===1?'#41666c55':'#bc643333');aura.addColorStop(1,'#00000000');ctx.fillStyle=aura;ctx.beginPath();ctx.arc(0,0,125,0,Math.PI*2);ctx.fill();
    if(n===0){ // Ashen Sentinel
      ctx.fillStyle=boss.flash?'#f4d28a':'#454b4d';ctx.beginPath();ctx.ellipse(0,5,50,62,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#272b2c';ctx.beginPath();ctx.arc(0,-29,36,Math.PI,0);ctx.lineTo(32,-12);ctx.lineTo(0,-2);ctx.lineTo(-32,-12);ctx.closePath();ctx.fill();ctx.fillStyle='#e5a65f';ctx.fillRect(-23,-19,13,4);ctx.fillRect(10,-19,13,4);ctx.strokeStyle='#b4996a';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(34,-2);ctx.lineTo(58,62);ctx.stroke();ctx.strokeStyle='#c7b18b';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(50,56);ctx.lineTo(72,52);ctx.stroke();ctx.fillStyle='#8c4f35';ctx.beginPath();ctx.moveTo(-37,18);ctx.lineTo(-66,65);ctx.lineTo(-27,48);ctx.closePath();ctx.fill();
    }else if(n===1){ // Gloam Wyrm
      ctx.fillStyle=boss.flash?'#b4e3d3':'#344e50';ctx.beginPath();ctx.ellipse(-2,8,67,30,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(14,-4);ctx.quadraticCurveTo(58,-55,74,-17);ctx.lineTo(45,5);ctx.lineTo(80,10);ctx.lineTo(49,25);ctx.quadraticCurveTo(15,27,10,12);ctx.fill();ctx.fillStyle='#b7d9c0';ctx.beginPath();ctx.moveTo(-13,-3);ctx.lineTo(-69,-50);ctx.lineTo(-50,1);ctx.lineTo(-80,36);ctx.lineTo(-19,22);ctx.fill();ctx.fillStyle='#e2b673';ctx.fillRect(65,-19,8,4);for(let i=0;i<7;i++){ctx.fillStyle='#9bb49e';ctx.beginPath();ctx.moveTo(-35+i*12,-8);ctx.lineTo(-30+i*12,-24);ctx.lineTo(-23+i*12,-8);ctx.fill()}
    }else{ // Hollow King
      ctx.fillStyle=boss.flash?'#f3d9a0':'#66513f';ctx.beginPath();ctx.ellipse(0,12,48,66,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#272322';ctx.beginPath();ctx.arc(0,-36,37,Math.PI,Math.PI*2);ctx.lineTo(33,-3);ctx.lineTo(0,8);ctx.lineTo(-33,-3);ctx.closePath();ctx.fill();ctx.fillStyle='#d99358';ctx.fillRect(-23,-21,14,4);ctx.fillRect(9,-21,14,4);ctx.fillStyle='#bb9b64';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-28+i*14,-39);ctx.lineTo(-24+i*14,-67-(i%2)*12);ctx.lineTo(-17+i*14,-38);ctx.fill()}ctx.strokeStyle='#a48b63';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-34,4);ctx.lineTo(-69,50);ctx.moveTo(34,4);ctx.lineTo(67,49);ctx.stroke();ctx.fillStyle='#823e32';ctx.fillRect(-23,23,46,43)}
    ctx.restore();
  }
  function drawShots(){for(const s of shots){ctx.save();ctx.shadowBlur=18;ctx.shadowColor='#ffc36b';ctx.strokeStyle='#f3c477';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(s.x-12,s.y);ctx.lineTo(s.x+5,s.y);ctx.stroke();ctx.fillStyle='#fff0c4';ctx.beginPath();ctx.arc(s.x+7,s.y,3,0,Math.PI*2);ctx.fill();ctx.restore()}for(const s of enemyShots){ctx.save();ctx.shadowBlur=16;ctx.shadowColor='#ef7651';ctx.fillStyle=stage===1?'#98c9ad':'#e87553';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffe0a6';ctx.beginPath();ctx.arc(s.x-2,s.y-2,2,0,Math.PI*2);ctx.fill();ctx.restore()}}
  function drawHUD(){if(state==='menu')return;ctx.save();ctx.fillStyle='#080b0dd9';pathRoundRect(22,20,200,45,5);ctx.fill();ctx.fillStyle='#9ca2a2';ctx.font='10px monospace';ctx.letterSpacing='2px';ctx.fillText('VITALITY',36,38);for(let i=0;i<3;i++){ctx.fillStyle=i<player.hp?'#bd634c':'#3b3532';ctx.beginPath();ctx.moveTo(39+i*28,49);ctx.lineTo(47+i*28,42);ctx.lineTo(55+i*28,49);ctx.lineTo(47+i*28,58);ctx.closePath();ctx.fill()}ctx.fillStyle='#080b0dd9';pathRoundRect(W-224,20,202,45,5);ctx.fill();ctx.fillStyle='#9ca2a2';ctx.font='10px monospace';ctx.fillText(`FATHOMS   ${String(Math.floor(distance/10)).padStart(4,'0')}`,W-208,47);
    if(boss){const bw=410,bx=(W-bw)/2,by=28;ctx.fillStyle='#090b0ddd';pathRoundRect(bx-15,by-17,bw+30,52,4);ctx.fill();ctx.fillStyle='#c7bfb0';ctx.font='10px monospace';ctx.textAlign='center';ctx.letterSpacing='2px';ctx.fillText(names[stage],W/2,by-1);ctx.textAlign='left';ctx.fillStyle='#302a26';ctx.fillRect(bx,by+9,bw,7);const grad=ctx.createLinearGradient(bx,0,bx+bw,0);grad.addColorStop(0,'#ac593f');grad.addColorStop(1,'#d49c60');ctx.fillStyle=grad;ctx.fillRect(bx,by+9,bw*Math.max(0,boss.hp/boss.max),7);ctx.fillStyle='#d5bc8e';ctx.fillRect(bx,by+8,bw*Math.max(0,boss.hp/boss.max),1)}
    ctx.fillStyle='#b49b73';ctx.font='10px monospace';ctx.letterSpacing='1px';for(let i=0;i<3;i++){ctx.fillStyle=i<stage?'#d8ae6d':'#3d3c38';ctx.beginPath();ctx.arc(42+i*19,H-30,4,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#777d7e';ctx.fillText('WARDENS',108,H-27);ctx.restore()}
  function render(){ctx.save();if(shake>0)ctx.translate(rand(-shake,shake),rand(-shake,shake));drawBackground();if(!boss)drawHazards();drawBoss();drawShots();drawPlayer();for(const p of particles){ctx.globalAlpha=Math.max(0,p.life*2);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;drawHUD();if(state==='paused'){ctx.fillStyle='#06090bb8';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle='#e8d7b6';ctx.font='24px serif';ctx.fillText('PAUSED',W/2,H/2);ctx.font='11px monospace';ctx.fillStyle='#a9a49a';ctx.fillText('PRESS P TO RETURN TO THE DEEP',W/2,H/2+27)}ctx.restore()}
  function frame(now){const dt=(now-last)/1000||0;last=now;update(dt);render();requestAnimationFrame(frame)}
  startButton.addEventListener('click',reset);
  window.addEventListener('keydown',e=>{if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();if(state==='menu'||state==='dead'||state==='won')reset();else if(state==='playing')flap()}if(e.code==='KeyJ'||e.code==='KeyK')strike();if(e.code==='KeyP'){if(state==='playing')state='paused';else if(state==='paused')state='playing'}if(e.code==='Escape'&&state==='playing')state='paused'});
  canvas.addEventListener('pointerdown',e=>{if(state!=='playing'){if(state==='menu'||state==='dead'||state==='won')reset();return}if(e.button===2||e.shiftKey)strike();else flap()});canvas.addEventListener('contextmenu',e=>e.preventDefault());
  document.querySelector('#flapButton').addEventListener('pointerdown',e=>{e.preventDefault();if(state==='playing')flap();else reset()});document.querySelector('#strikeButton').addEventListener('pointerdown',e=>{e.preventDefault();strike()});
  document.querySelector('#soundToggle').addEventListener('click',e=>{soundOn=!soundOn;e.currentTarget.querySelector('span').textContent=soundOn?'SOUND ON':'SOUND OFF';e.currentTarget.setAttribute('aria-label',soundOn?'Mute sound':'Enable sound');if(soundOn)beep(480,.08)});
  // Start screen ambiance
  requestAnimationFrame(frame);
})();
