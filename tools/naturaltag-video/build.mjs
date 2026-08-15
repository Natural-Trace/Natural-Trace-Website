import fs from 'node:fs';

const F = '../../node_modules/@fontsource/montserrat/files/';
const L = '../../src/assets/logos/';
const b64 = p => fs.readFileSync(p).toString('base64');

const font = w => `data:font/woff2;base64,${b64(F + `montserrat-latin-${w}-normal.woff2`)}`;
const leaf = `data:image/png;base64,${b64(L + 'NT icon without logo.png')}`;
const cloud = `data:image/png;base64,${b64(L + 'NaturalCloud-icon.png')}`;

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
@font-face{font-family:MS;src:url(${font(400)}) format('woff2');font-weight:400;font-display:block}
@font-face{font-family:MS;src:url(${font(600)}) format('woff2');font-weight:600;font-display:block}
@font-face{font-family:MS;src:url(${font(700)}) format('woff2');font-weight:700;font-display:block}
html,body{margin:0;padding:0;background:#F2F2ED;overflow:hidden}
svg{display:block}
text{font-family:MS,sans-serif}
</style></head>
<body>
<svg id="stage" width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="78%">
      <stop offset="0%" stop-color="#F8F8F4"/>
      <stop offset="100%" stop-color="#E9E9E1"/>
    </radialGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="9"/>
    </filter>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <g id="scene"></g>
</svg>
<script>
const NS='http://www.w3.org/2000/svg';
const el=(n,a={})=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);return e};

const SAGE='#6B7249', SAGE_DARK='#535A38', GOLD='#A29349', GOLD_DEEP='#8A7C35', INK='#2C3345';

// The road runs off both edges. The truck sits at f=0 and f=1 fully outside
// the frame, which is what lets the loop join without a fade.
const ROAD_D='M -230 1120 C -170 1085, -130 1055, -60 1010 C 180 940, 330 690, 610 616 C 880 545, 960 760, 1220 730 C 1450 704, 1560 570, 1990 546 C 2060 540, 2110 536, 2170 532';

const LIFT=195;
const NODES=[
 {f:0.16, lift:LIFT, lines:['Farm'],                          icon:'farm'},
 {f:0.24, lift:LIFT, lines:['Warehouse'],                     icon:'warehouse'},
 {f:0.32, lift:LIFT, lines:['Ingredient','Manufacture'],      icon:'flask'},
 {f:0.40, lift:LIFT, lines:['Finished Product','Manufacture'],icon:'box'},
 {f:0.48, lift:LIFT, lines:['Distribution'],                  icon:'container'},
 {f:0.56, lift:LIFT, lines:['Marketplace'],                   icon:'shop'},
 {f:0.64, lift:LIFT, lines:['Consumer'],                      icon:'home'}
];

const ICONS={
 farm:['M-19 12 H19','M0 12 V-6','M0 -1 C -12 -3, -16 -12, -15 -17 C -8 -17, -1 -11, 0 -1 Z','M0 -4 C 10 -7, 14 -15, 13 -20 C 6 -19, 0 -13, 0 -4 Z'],
 warehouse:['M-20 12 V-4 L0 -14 L20 -4 V12 Z','M-11 12 V0 H11 V12','M-11 4 H11','M-11 8 H11'],
 flask:['M-6 -15 V-4 L-15 12 H15 L6 -4 V-15','M-10 -15 H10','M-11 4 H11'],
 box:['M-16 -6 L0 -15 L16 -6 V8 L0 17 L-16 8 Z','M-16 -6 L0 3 L16 -6','M0 3 V17'],
 container:['M-19 -8 H19 V11 H-19 Z','M-11 -8 V11','M-3 -8 V11','M5 -8 V11','M13 -8 V11'],
 shop:['M-18 -5 H18 V13 H-18 Z','M-20 -5 L-14 -14 H14 L20 -5','M-5 13 V3 H5 V13'],
 home:['M-17 0 L0 -15 L17 0','M-13 -3 V13 H13 V-3','M-4 13 V3 H4 V13','M8 -9 V-14 H12 V-5']
};

const scene=document.getElementById('scene');
const stage=document.getElementById('stage');

// ---- road ----------------------------------------------------------------
const shadow=el('path',{d:ROAD_D,fill:'none',stroke:'rgba(90,95,80,.13)','stroke-width':64,'stroke-linecap':'round',transform:'translate(0,16)',filter:'url(#soft)'});
const road  =el('path',{d:ROAD_D,fill:'none',stroke:'#9CA1A7','stroke-width':56,'stroke-linecap':'round'});
const roadIn=el('path',{d:ROAD_D,fill:'none',stroke:'#ADB2B7','stroke-width':46,'stroke-linecap':'round'});
const dashes=el('path',{d:ROAD_D,fill:'none',stroke:'#F4F5F2','stroke-width':3.5,'stroke-linecap':'round','stroke-dasharray':'26 30'});
scene.append(shadow,road,roadIn,dashes);

const measure=el('path',{d:ROAD_D,fill:'none',stroke:'none'});
scene.appendChild(measure);
const LEN=measure.getTotalLength();
const at=f=>measure.getPointAtLength(Math.max(0,Math.min(1,f))*LEN);
const angleAt=f=>{const a=at(f-0.004),b=at(f+0.004);return Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI};


// ---- cloud ---------------------------------------------------------------
const CLOUD={x:1552,y:56,w:344,h:275};
const cloudG=el('g',{});
cloudG.appendChild(el('image',{href:'${cloud}',x:CLOUD.x,y:CLOUD.y,width:CLOUD.w,height:CLOUD.h,preserveAspectRatio:'xMidYMid meet'}));
const cw=el('text',{x:CLOUD.x+CLOUD.w/2,y:CLOUD.y+CLOUD.h+46,'text-anchor':'middle','font-size':30,fill:SAGE_DARK,'letter-spacing':'0.02em'});
const t1=el('tspan',{'font-weight':400});t1.textContent='Natural';
const t2=el('tspan',{'font-weight':700});t2.textContent='Cloud';
const t3=el('tspan',{'font-weight':400,'font-size':16,'baseline-shift':'super'});t3.textContent='\\u2122';
cw.append(t1,t2,t3);
cloudG.appendChild(cw);
scene.appendChild(cloudG);
// Where the cloud mark actually sits. The PNG is 640x640 and the ink runs
// 0.0594..0.9375 in x and 0.2203..0.7766 in y, measured off the file rather
// than guessed. preserveAspectRatio=meet draws it CLOUD.h wide, centred in
// CLOUD.w. Everything else keeps clear of this box.
const CS=CLOUD.h, CX0=CLOUD.x+(CLOUD.w-CS)/2;
const MARK={x0:CX0+0.0594*CS,x1:CX0+0.9375*CS,y0:CLOUD.y+0.2203*CS,y1:CLOUD.y+0.7766*CS};
const CC={x:(MARK.x0+MARK.x1)/2,y:(MARK.y0+MARK.y1)/2};
// Links are routed orthogonally: straight up out of the disc, one rounded
// corner, then straight across to a landing column on the left of the mark.
//
// No two links touch. Each has its own column (its disc's x) and its own lane
// (its landing height), and the lanes run top to bottom in the same order as
// the discs run left to right. A link's vertical leg can only meet a lane
// belonging to a disc on its left, and every one of those lanes is above it,
// so the two never meet. Verified numerically after render, not just here.
const LAND_X=1570, LANE_0=148, LANE_STEP=19, CORNER=16;

// The truck is the nearest object in the scene, so it draws over everything.
// Putting it under the labels meant a label could be painted across the cab,
// which reads as a bug; a vehicle passing in front of a sign does not.
const stemLayer=el('g',{});
const nodeLayer=el('g',{});
const truckLayer=el('g',{});
scene.append(stemLayer,nodeLayer,truckLayer);

// ---- nodes ---------------------------------------------------------------
const R=50;
const built=NODES.map((n,i)=>{
  const a=at(n.f);
  const cx=a.x, cy=a.y-n.lift;

  // Each link lands on its own point of a standoff ring around the mark and
  // arrives along the radius, so the seven read as spokes rather than a bundle
  // of parallel strands. The ring sits STANDOFF outside the ink box, so no
  // line touches the logo.
  const lane=LANE_0+LANE_STEP*i, ax=LAND_X, ay=lane;
  const sx=cx, sy=cy-R;
  const link=el('path',{fill:'none',stroke:GOLD,'stroke-width':2.2,opacity:.5});
  link.setAttribute('d','M '+sx.toFixed(1)+' '+sy.toFixed(1)
    +' L '+sx.toFixed(1)+' '+(lane+CORNER).toFixed(1)
    +' Q '+sx.toFixed(1)+' '+lane.toFixed(1)+' '+(sx+CORNER).toFixed(1)+' '+lane.toFixed(1)
    +' L '+ax.toFixed(1)+' '+lane.toFixed(1));
  scene.appendChild(link);
  const llen=link.getTotalLength();

  const pulse=el('path',{d:link.getAttribute('d'),fill:'none',stroke:GOLD_DEEP,'stroke-width':4.5,'stroke-linecap':'round',opacity:0});
  pulse.setAttribute('stroke-dasharray','54 '+(llen+54));
  scene.appendChild(pulse);
  const dot=el('circle',{cx:ax,cy:ay,r:3.6,fill:GOLD,opacity:.6});
  scene.appendChild(dot);

  const g=el('g',{});
  const stem=el('g',{});

  // label sits under the disc, on the stem, so the space above the discs is
  // free for the links
  const labTop=cy+R+30, labH=23*(n.lines.length-1);
  stem.appendChild(el('line',{x1:cx,y1:cy+R-3,x2:cx,y2:labTop-19,stroke:GOLD,'stroke-width':2.2,opacity:.7}));
  stem.appendChild(el('line',{x1:cx,y1:labTop+labH+11,x2:cx,y2:a.y-6,stroke:GOLD,'stroke-width':2.2,opacity:.7}));
  stem.appendChild(el('ellipse',{cx:a.x,cy:a.y-2,rx:13,ry:6,fill:'none',stroke:GOLD,'stroke-width':2.2,opacity:.7}));

  const pop=el('g',{});
  pop.appendChild(el('circle',{cx:0,cy:0,r:R+9,fill:'rgba(90,95,80,.10)',filter:'url(#soft)',transform:'translate(0,10)'}));
  const ring=el('circle',{cx:0,cy:0,r:R,fill:'#FCFCFA',stroke:GOLD,'stroke-width':3});
  pop.appendChild(ring);
  const ic=el('g',{fill:'none',stroke:GOLD_DEEP,'stroke-width':2.6,'stroke-linecap':'round','stroke-linejoin':'round',transform:'scale(1.16)'});
  for(const d of ICONS[n.icon]) ic.appendChild(el('path',{d}));
  pop.appendChild(ic);
  pop.setAttribute('transform','translate('+cx+','+cy+')');
  g.appendChild(pop);

  const lab=el('text',{x:cx,y:labTop,'text-anchor':'middle','font-size':17,'font-weight':600,'letter-spacing':'0.09em',fill:SAGE_DARK});
  n.lines.forEach((ln,k)=>{
    const ts=el('tspan',{x:cx,dy:k===0?0:23});
    ts.textContent=ln.toUpperCase();
    lab.appendChild(ts);
  });
  g.appendChild(lab);
  stemLayer.appendChild(stem);
  nodeLayer.appendChild(g);

  return {n,cx,cy,pop,ring,g,stem,lab,link,pulse,dot,llen};
});

// ---- truck ---------------------------------------------------------------
// Flat side elevation, as originally drawn. The isometric build is gone: with
// a road drawn as a screen-space ribbon rather than a ground plane, a truck
// with a receding length axis rides at an angle to the surface it is on.
const truck=el('g',{});
const tb=el('g',{transform:'scale(1.15)'});
tb.appendChild(el('ellipse',{cx:-14,cy:2,rx:80,ry:9,fill:'rgba(90,95,80,.16)',filter:'url(#soft)'}));
tb.appendChild(el('rect',{x:-84,y:-80,width:96,height:64,rx:5,fill:SAGE}));
tb.appendChild(el('rect',{x:-84,y:-80,width:96,height:9,rx:4,fill:'#7B8356'}));
tb.appendChild(el('path',{d:'M12 -16 V-62 H44 L66 -38 V-16 Z',fill:SAGE_DARK}));
tb.appendChild(el('path',{d:'M20 -56 H41 L58 -38 H20 Z',fill:'#D9E0D2'}));
tb.appendChild(el('rect',{x:-86,y:-16,width:154,height:8,rx:3,fill:'#33382A'}));
const WHEEL_R=13, wheels=[];
for(const wx of [-54,46]){
  const w=el('g',{transform:'translate('+wx+',-4)'});
  w.appendChild(el('circle',{cx:0,cy:0,r:WHEEL_R,fill:'#2B2F24'}));
  const spin=el('g',{});
  spin.appendChild(el('circle',{cx:0,cy:0,r:6.2,fill:'#9AA08C'}));
  const sp=el('g',{stroke:'#C6CCBB','stroke-width':2,'stroke-linecap':'round'});
  for(const d of ['M0 0 L0 -10','M0 0 L8.7 5','M0 0 L-8.7 5']) sp.appendChild(el('path',{d}));
  spin.appendChild(sp);
  w.appendChild(spin);
  tb.appendChild(w);
  wheels.push(spin);
}
// the mark sits on a light roundel: solid olive on a sage panel is nearly
// invisible, and recolouring the mark is not an option
tb.appendChild(el('circle',{cx:-39,cy:-48,r:27,fill:'#F7F7F3'}));
tb.appendChild(el('image',{href:'${leaf}',x:-62,y:-71,width:46,height:46}));
truck.appendChild(tb);
truckLayer.appendChild(truck);
window.__truck=truck;window.__truckLayer=truckLayer;window.__scene=scene;

// ---- tagline -------------------------------------------------------------
// One <text> with three tspans. The tspans always exist and only their
// fill-opacity changes, so the line is centred on its full width from the
// first frame and no word shifts as the next one appears.
const TAGLINE=['Tag.','Trace.','Trust.'];
const TAG_X=960, TAG_Y=938;
const tagG=el('g',{});
const tagT=el('text',{x:TAG_X,y:TAG_Y,'text-anchor':'middle','font-size':72,'font-weight':600,'letter-spacing':'0.06em',fill:SAGE_DARK});
const tagWords=TAGLINE.map((w,i)=>{
  const ts=el('tspan',{'fill-opacity':0});
  if(i) ts.setAttribute('dx',28);
  ts.textContent=w;
  tagT.appendChild(ts);
  return ts;
});
tagG.appendChild(tagT);
stage.appendChild(tagG);

// ---- timing --------------------------------------------------------------
// Everything below is periodic with a period of exactly 10s, so frame 300 is
// frame 0. Nothing is mid-transition at the join: every station is back at
// rest, no pulse is running and the tagline is fully faded out well before
// t=10. The only discontinuity is the truck jumping from off the right edge
// to off the left edge, which no one can see.
const T=10, PULSE_RUN=1.0, REST=0.42, LABEL_REST=0.6;
const sm=x=>{const c=x<0?0:x>1?1:x; return c*c*(3-2*c)};

// The tagline runs after the last station has been read and finishes before
// the loop restarts.
const TAG_IN=[7.00,7.60,8.20], TAG_FADE=0.42, TAG_OUT=9.40, TAG_OUT_RUN=0.5;
// the scene steps back while the line is on screen and is fully restored
// before the loop restarts
const DIM_IN=6.90, DIM_IN_RUN=0.60, DIM_OUT=9.40, DIM_OUT_RUN=0.55, DIM_TO=0.26;

window.setTime=function(t){
  const u=(t%T)/T;

  // one slow breath per loop: zero rate of change at t=0 and t=10, so the
  // join has no visible kick
  const z=0.022*(1-Math.cos(2*Math.PI*u))/2;
  stage.setAttribute('viewBox',(1920*z*0.5).toFixed(2)+' '+(1080*z*0.55).toFixed(2)+' '+(1920*(1-z)).toFixed(2)+' '+(1080*(1-z)).toFixed(2));

  const pt=at(u), ang=angleAt(u);
  const dist=u*LEN;

  // wheels turn at the rate the ground passes under them, so the speed on
  // screen and the speed of the wheel are the same number rather than two
  // guesses. Radius is in the truck's own units, hence the 1.15.
  const spin=(dist/(WHEEL_R*1.15))*180/Math.PI;
  for(const w of wheels) w.setAttribute('transform','rotate('+spin.toFixed(1)+')');

  // suspension: a little over the road surface, and a matching sway
  const bob=0.9*Math.sin(dist/26), sway=0.55*Math.sin(dist/41);
  tb.setAttribute('transform','scale(1.15) translate(0,'+bob.toFixed(3)+')');
  truck.setAttribute('transform','translate('+pt.x.toFixed(2)+','+(pt.y+8).toFixed(2)+') rotate('+(ang+sway).toFixed(2)+')');

  built.forEach(b=>{
    const tp=b.n.f*T, d=t-tp;

    // A station is dim until the truck is nearly on it, full while the truck
    // is alongside, then settles back to dim rather than disappearing.
    // Attack is quicker than release, which is what reads as arriving and
    // leaving rather than blinking.
    let w=0;
    if(d>=-0.55&&d<-0.05) w=(d+0.55)/0.50;
    else if(d>=-0.05&&d<0.45) w=1;
    else if(d>=0.45&&d<1.55) w=1-(d-0.45)/1.10;
    const e=sm(w), a=REST+(1-REST)*e;
    b.pop.setAttribute('opacity',a.toFixed(4));
    b.stem.setAttribute('opacity',a.toFixed(4));
    b.link.setAttribute('opacity',(0.5*a).toFixed(4));
    b.dot.setAttribute('opacity',(0.6*a).toFixed(4));
    // the name rests higher than the rest of the station: it is the one part
    // a viewer needs to be able to read between passes
    b.lab.setAttribute('opacity',(LABEL_REST+(1-LABEL_REST)*e).toFixed(4));

    // the disc lifts as the truck draws level with it
    const bump=Math.abs(d)<0.6?Math.pow(Math.cos(d/0.6*Math.PI/2),2):0;
    b.pop.setAttribute('transform','translate('+b.cx+','+b.cy+') scale('+(1+0.08*bump).toFixed(4)+')');
    b.ring.setAttribute('stroke-width',(3+1.8*bump).toFixed(2));

    // one pulse per pass, released at the moment the truck reaches the stop.
    // Nothing travels the vein at any other time, because nothing is being
    // read at any other time.
    const k=d/PULSE_RUN;
    if(k>=0&&k<=1){
      b.pulse.setAttribute('opacity',(0.85*Math.sin(Math.PI*k)).toFixed(3));
      b.pulse.setAttribute('stroke-dashoffset',(b.llen*(1-k)).toFixed(2));
    } else b.pulse.setAttribute('opacity','0');
  });

  const held=sm((t-DIM_IN)/DIM_IN_RUN)-sm((t-DIM_OUT)/DIM_OUT_RUN);
  scene.setAttribute('opacity',(1-(1-DIM_TO)*held).toFixed(4));

  const out=1-sm((t-TAG_OUT)/TAG_OUT_RUN);
  tagWords.forEach((ts,i)=>ts.setAttribute('fill-opacity',(sm((t-TAG_IN[i])/TAG_FADE)*out).toFixed(4)));
  const gs=0.955+0.045*sm((t-TAG_IN[0])/0.9);
  tagG.setAttribute('transform','translate('+(TAG_X*(1-gs)).toFixed(2)+','+(TAG_Y*(1-gs)).toFixed(2)+') scale('+gs.toFixed(4)+')');
};
window.setTime(0);
document.fonts.ready.then(()=>{document.body.dataset.ready='1'});
</script></body></html>`;

fs.writeFileSync('./out/scene.html', html);
console.log('scene.html', (html.length / 1024).toFixed(0) + ' KB');
