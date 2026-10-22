const T=THREE,$=id=>document.getElementById(id),V=(x,y,z)=>new T.Vector3(x,y,z);
const R=new T.WebGLRenderer({antialias:true,canvas:$('c')});R.setPixelRatio(Math.min(devicePixelRatio,2));
const scene=new T.Scene();scene.background=new T.Color(0);
const cam=new T.PerspectiveCamera(38,1,.1,200);let az=.35,el=.85,dist=26;
function camU(){cam.position.set(dist*Math.sin(az)*Math.cos(el),dist*Math.sin(el),dist*Math.cos(az)*Math.cos(el));cam.lookAt(0,0,0)}
function rs(){R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}
addEventListener('resize',rs);rs();camU();
let drag=false,px=0,py=0;const cv=$('c');
cv.onpointerdown=e=>{drag=true;px=e.clientX;py=e.clientY;cv.setPointerCapture(e.pointerId)};
cv.onpointerup=()=>drag=false;
cv.onpointermove=e=>{if(!drag)return;az-=(e.clientX-px)*.007;el=Math.max(-1.4,Math.min(1.5,el+(e.clientY-py)*.007));px=e.clientX;py=e.clientY;camU()};
cv.onwheel=e=>{e.preventDefault();dist=Math.max(10,Math.min(60,dist*(1+e.deltaY*.001)));camU()};

const LM=new T.LineBasicMaterial({color:0xffffff}),DM=new T.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.35});
const FM=new T.MeshBasicMaterial({color:0,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
const rig=new T.Group(),ctrl=new T.Group();scene.add(rig);rig.add(ctrl);
function mk(g,p=ctrl,ang=30,m=LM){const o=new T.Group();o.add(new T.Mesh(g,FM),new T.LineSegments(new T.EdgesGeometry(g,ang),m));p.add(o);return o}
const pts=(r,n=32,y=0,a=0)=>Array.from({length:n},(_,i)=>V(r*Math.cos(i/n*6.28318+a),y,r*Math.sin(i/n*6.28318+a)));
const loop=(p,par,m=LM)=>{const l=new T.LineLoop(new T.BufferGeometry().setFromPoints(p),m);par.add(l);return l};
const seg=(p,par,m=LM)=>{const l=new T.LineSegments(new T.BufferGeometry().setFromPoints(p),m);par.add(l);return l};
const G=(x,y,z,par=ctrl)=>{const g=new T.Group();g.position.set(x,y,z);par.add(g);return g};
const sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};

/* ---- body: lofted contour rings (units: cm) ---- */
const TOP=1.6;
const half=[[0,3.2],[3.4,3.15],[5.4,3.15],[7,2.8],[7.9,1.9],[8.1,.5],[7.95,-1.4],[7.7,-3.4],[7.1,-5.4],[6.2,-6.9],[5,-7.3],[4,-6.8],[3.3,-5.4],[2.6,-4.2],[1.5,-3.85],[0,-3.9]];
const full=half.map(p=>V(p[0],0,-p[1]));for(let i=half.length-2;i>=1;i--)full.push(V(-half[i][0],0,-half[i][1]));
const P=new T.CatmullRomCurve3(full,true,'centripetal').getSpacedPoints(240);P.pop();
const N=P.length,K=13,pos=[],nr=P.map((p,i)=>{const a=P[(i+1)%N],b=P[(i+N-1)%N];return V(a.z-b.z,0,-(a.x-b.x)).normalize()});
const bot=p=>-(1.5+2.1*sm((p.z-1)/6)*(.45+.55*sm((Math.abs(p.x)-1)/3)));
for(let k=0;k<K;k++){const th=-Math.PI/2+Math.PI*k/(K-1),u=Math.sin(th),ins=(th<0?1.2:.9)*(1-Math.cos(th));
 for(let i=0;i<N;i++){const p=P[i],n=nr[i],b=bot(p),c=(TOP+b)/2,h=(TOP-b)/2;pos.push(p.x-n.x*ins,c+h*u,p.z-n.z*ins)}}
const idx=[],lp=[];
for(let k=0;k<K;k++)for(let i=0;i<N;i++){const j=(i+1)%N,a=k*N+i,b=k*N+j;
 lp.push(V(pos[a*3],pos[a*3+1],pos[a*3+2]),V(pos[b*3],pos[b*3+1],pos[b*3+2]));
 if(k<K-1){const c=(k+1)*N+i,d=(k+1)*N+j;idx.push(a,b,c,b,d,c);
  if(i%10===0)lp.push(V(pos[a*3],pos[a*3+1],pos[a*3+2]),V(pos[c*3],pos[c*3+1],pos[c*3+2]))}}
[0,K-1].forEach(k=>{const c=P.map((_,i)=>new T.Vector2(pos[(k*N+i)*3],pos[(k*N+i)*3+2]));
 T.ShapeUtils.triangulateShape(c,[]).forEach(t=>idx.push(k*N+t[0],k*N+t[1],k*N+t[2]))});
const bg=new T.BufferGeometry();bg.setAttribute('position',new T.Float32BufferAttribute(pos,3));bg.setIndex(idx);
ctrl.add(new T.Mesh(bg,FM));seg(lp,ctrl,DM);
loop(Array.from({length:N},(_,i)=>V(pos[((K-1)*N+i)*3],TOP,pos[((K-1)*N+i)*3+2])),ctrl);
loop(Array.from({length:N},(_,i)=>V(pos[(((K-1)/2|0)*N+i)*3],pos[(((K-1)/2|0)*N+i)*3+1],pos[(((K-1)/2|0)*N+i)*3+2])),ctrl);

const NW=6,WV=Array.from({length:NW},()=>({o:V(0,0,0),a:9})),WU={uO:{value:WV.map(w=>w.o.clone())},uR:{value:new Array(NW).fill(0)},uA:{value:new Array(NW).fill(0)}};let wi=0;
const wm=l=>new T.ShaderMaterial({uniforms:{uO:WU.uO,uR:WU.uR,uA:WU.uA,uL:{value:l}},transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,
 vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform vec3 uO[6];uniform float uR[6];uniform float uA[6];uniform float uL;varying vec3 vP;void main(){float b=0.;for(int i=0;i<6;i++){float x=(length(vP-uO[i])-uR[i])/1.1;b+=exp(-x*x)*uA[i];}if(uL>.5&&b<.03)discard;gl_FragColor=vec4(vec3(1.),min(1.,b*(uL>.5?1.4:.5)));}'});
{const m=new T.Mesh(bg,wm(0));m.renderOrder=2;ctrl.add(m);const l=new T.LineSegments(new T.BufferGeometry().setFromPoints(lp),wm(1));l.renderOrder=3;ctrl.add(l)}
/* ---- parts ---- */
function rrect(w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
// touchpad
const tp=G(0,TOP,-1);{const g=new T.ExtrudeGeometry(rrect(6,2.6,.5),{depth:.16,bevelEnabled:false});g.rotateX(-Math.PI/2);mk(g,tp,20);}
const tdots=[0,1].map(()=>{const d=G(0,.22,0,tp);loop(pts(.2,20),d);loop(pts(.07,10),d);d.visible=false;return d});
// light bar, usb, speaker
{const lb=rrect(5.4,.3,.15).getPoints(10).map(p=>V(p.x,1+p.y,-3.05+p.x*p.x*.018));loop(lb,ctrl);loop(lb.map(p=>V(p.x*.94,1+(p.y-1)*.45,p.z-.01)),ctrl,DM)}
mk(new T.BoxGeometry(.9,.25,.3),ctrl).position.set(0,.1,-3.2);
{const s=[];for(let r=0;r<3;r++)for(let c=0;c<4;c++)s.push(V((c-1.5)*.26,TOP+.01,2.3+r*.26));
 ctrl.add(new T.Points(new T.BufferGeometry().setFromPoints(s),new T.PointsMaterial({color:0xffffff,size:2,sizeAttenuation:false})))}
// sticks
function stick(x,z){const g=G(x,TOP,z);loop(pts(1.15,40,.01),g);loop(pts(1,40,.01),g,DM);
 const piv=G(0,0,0,g);mk(new T.CylinderGeometry(.3,.35,.9,16),piv).position.y=.45;
 const cap=G(0,.95,0,piv);mk(new T.CylinderGeometry(.82,.72,.42,36),cap,20);[.6,.38,.16].forEach(r=>loop(pts(r,28,.22),cap,DM));return{g,piv,x,z}}
const sL=stick(-3,1.5),sR=stick(3,1.5);
// face buttons
const FB={};[['tri',0,-1.05],['cir',1.05,0],['cro',0,1.05],['sqr',-1.05,0]].forEach(([k,dx,dz])=>{
 const b=G(5.15+dx,TOP,-.3+dz);mk(new T.CylinderGeometry(.5,.5,.28,28),b).position.y=.14;
 if(k=='tri')loop(pts(.28,3,.3,-Math.PI/2),b);if(k=='cir')loop(pts(.22,20,.3),b);
 if(k=='sqr')loop([V(-.2,.3,-.2),V(.2,.3,-.2),V(.2,.3,.2),V(-.2,.3,.2)],b);
 if(k=='cro')seg([V(-.2,.3,-.2),V(.2,.3,.2),V(-.2,.3,.2),V(.2,.3,-.2)],b);FB[k]=b});
const FC={tri:0x40ff90,cir:0xff3a48,cro:0x4a8cff,sqr:0xd070ff},FG={},fgl={tri:0,cir:0,cro:0,sqr:0};
for(const k in FB){const gm=new T.MeshBasicMaterial({color:FC[k],transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}),m=new T.Mesh(new T.CircleGeometry(.5,28),gm);m.rotation.x=-Math.PI/2;m.position.y=.31;FB[k].add(m);FG[k]=gm;
 const rm=new T.LineBasicMaterial({color:FC[k],transparent:true,opacity:0});FB[k].add(new T.LineLoop(new T.BufferGeometry().setFromPoints(pts(.5,28,.3)),rm));FG[k+'r']=rm}
// d-pad
const dp=G(-5.15,TOP,-.3);loop(pts(1.7,40,.01),dp,DM);
const dpv=G(0,0,0,dp);{const a=.45,L=1.45,s=new T.Shape();[[-a,L],[a,L],[a,a],[L,a],[L,-a],[a,-a],[a,-L],[-a,-L],[-a,-a],[-L,-a],[-L,a],[-a,a]].forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));
 const g=new T.ExtrudeGeometry(s,{depth:.3,bevelEnabled:false});g.rotateX(-Math.PI/2);mk(g,dpv,30);
 [[0,-1],[1,0],[0,1],[-1,0]].forEach(([x,z])=>loop(pts(.2,3,.32,Math.atan2(z,x)).map(p=>p.add(V(x*1.0,0,z*1.0))),dpv))}
// share / options / PS
const SH=G(-4.3,TOP+.1,-1.7),OP=G(4.3,TOP+.1,-1.7);
[[SH,.45],[OP,-.45]].forEach(([g,a])=>{const m=mk(new T.BoxGeometry(.3,.2,.85),g);m.rotation.y=a});
const PS=G(0,TOP,1.3);mk(new T.CylinderGeometry(.42,.42,.2,28),PS).position.y=.1;loop(pts(.26,24,.21),PS,DM);
// bumpers + triggers
function bar(w,h,r,len,par){const sh=rrect(w,h,r),pp=sh.getPoints(5),g=new T.ExtrudeGeometry(sh,{depth:len,bevelEnabled:false,curveSegments:5});g.translate(0,0,-len/2);g.rotateY(Math.PI/2);par.add(new T.Mesh(g,FM));
 const e=[],l=len/2;pp.forEach((p,i)=>{const a=V(-l,p.y,-p.x),b=V(l,p.y,-p.x),q=pp[(i+1)%pp.length];if(i%6==0)e.push(a,b);e.push(a,V(-l,q.y,-q.x),b,V(l,q.y,-q.x))});seg(e,par)}
const L1=G(-5.3,1.75,-2.7),R1=G(5.3,1.75,-2.7);[L1,R1].forEach(g=>bar(1.3,.5,.22,3.2,g));
const tg=new T.ExtrudeGeometry(new T.Shape((()=>{const a=new T.CatmullRomCurve3([[-.3,.3],[.6,.3],[1.15,-.15],[1.4,-.9],[1.3,-1.65],[.85,-1.7],[.85,-1],[.55,-.4],[-.3,-.4]].map(p=>V(p[0],p[1],0)),true,'centripetal').getPoints(70);a.pop();return a.map(p=>new T.Vector2(p.x,p.y))})()),{depth:3,bevelEnabled:true,bevelSize:.08,bevelThickness:.1,bevelSegments:3});
tg.translate(0,0,-1.6);tg.rotateY(Math.PI/2);
const L2=G(-5.3,1,-2.5),R2=G(5.3,1,-2.5);[L2,R2].forEach(g=>mk(tg,g,25));

const LBM=new T.MeshBasicMaterial({color:0x0050ff,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6});
{const g=new T.ShapeGeometry(rrect(5.2,.2,.1),8),a=g.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,-3.1+a.getX(i)**2*.018);const m=new T.Mesh(g,LBM);m.position.y=1;ctrl.add(m)}
const gc=document.createElement('canvas');gc.width=gc.height=128;{const x=gc.getContext('2d'),r=x.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.35,'rgba(255,255,255,.35)');r.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=r;x.fillRect(0,0,128,128)}
const GLM=new T.SpriteMaterial({map:new T.CanvasTexture(gc),color:0x0050ff,transparent:true,blending:T.AdditiveBlending,depthWrite:false}),glow=new T.Sprite(GLM);glow.scale.set(9,2.8,1);glow.position.set(0,1,-3.5);ctrl.add(glow);
const lc=document.createElement('canvas');lc.width=512;lc.height=256;
{const x=lc.getContext('2d');x.strokeStyle='#fff';x.lineWidth=15;x.lineCap=x.lineJoin='round';x.shadowColor='#fff';x.shadowBlur=24;x.translate(-24,0);
 x.beginPath();x.moveTo(125,225);x.lineTo(125,40);x.lineTo(235,40);x.bezierCurveTo(300,40,300,135,235,135);x.lineTo(125,135);
 x.moveTo(450,82);x.bezierCurveTo(435,45,335,58,340,105);x.bezierCurveTo(345,148,445,128,445,175);x.bezierCurveTo(450,225,350,228,322,192);x.stroke()}
const LGM=new T.MeshBasicMaterial({map:new T.CanvasTexture(lc),transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}),logo=new T.Mesh(new T.PlaneGeometry(3.6,1.8),LGM);logo.rotation.x=-Math.PI/2;logo.position.y=.19;tp.add(logo);
// rumble motors (visible in X-ray): left = big/strong, right = small/weak
loop([V(-4,-.2,-2.2),V(4,-.2,-2.2),V(4,-.2,2.2),V(-4,-.2,2.2)],ctrl,DM);
const cz=(r,len,z,par,ang=30,ts=0,tl=6.2832)=>{const g=new T.CylinderGeometry(r,r,len,20,1,false,ts,tl);g.rotateX(Math.PI/2);const o=mk(g,par,ang);o.position.z=z;return o},
 ring=(r,z,par,m=LM)=>loop(pts(r,28).map(p=>V(p.x,p.z,z)),par,m);
function motor(s,big){const R=big?.65:.48,L=big?2.4:1.8,wr=big?.58:.4,wl=big?.85:.5,zw=-L/2-.75,g=G(s*5.1,-.9,5);g.rotation.y=-s*.245;
 cz(R,L,0,g);cz(R*.8,.2,L/2+.1,g);cz(.22,.35,-L/2-.17,g);
 [-.3,0,.3].forEach(k=>ring(R+.04,k*L,g,DM));
 [-1,1].forEach(k=>{const z=k*L*.3;ring(R+.14,z,g);mk(new T.BoxGeometry(2*R+.7,.12,.5),g,30).position.set(0,-R-.2,z);
  [-1,1].forEach(c=>mk(new T.CylinderGeometry(.14,.14,.5,10),g,30).position.set(c*(R+.3),-R-.3,z))});
 [-1,1].forEach(c=>mk(new T.BoxGeometry(.14,.3,.3),g,30).position.set(c*.2,0,L/2+.35));
 const sp=G(0,0,0,g);cz(.07,1,-L/2-.5,sp);cz(.17,.3,-L/2-.55,sp);cz(wr,wl,zw,sp,30,0,Math.PI);
 ring(wr+.16,zw-wl/2,g,DM);ring(wr+.16,zw+wl/2,g,DM);
 const sr=new T.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0});ring(wr,zw,g,sr);
 seg([V(s*4.7,-.75,6.4),V(s*3.2,-.5,5),V(s*3.2,-.5,5),V(s*2.2,-.2,2.6),V(s*4.7,-1.05,6.4),V(s*3.2,-.8,5),V(s*3.2,-.8,5),V(s*2.2,-.3,2.6)],ctrl,DM);
 return{g,sp,sr,ang:0,bx:s*5.1,by:-.9}}
const MT=[motor(-1,true),motor(1,false)];
/* ---- input state ---- */
const S={lx:0,ly:0,rx:0,ry:0,l2:0,r2:0,d:{u:0,d:0,l:0,r:0},b:{},t:[{a:0,x:0,y:0},{a:0,x:0,y:0}]};
let hid=false,dev=null;const st=m=>$('st').textContent=m;
function pollPad(){const gp=[...(navigator.getGamepads?navigator.getGamepads():[])].find(g=>g&&g.connected);if(!gp)return false;
 const B=i=>gp.buttons[i]&&gp.buttons[i].pressed,b=S.b;
 S.lx=gp.axes[0]||0;S.ly=gp.axes[1]||0;S.rx=gp.axes[2]||0;S.ry=gp.axes[3]||0;
 b.cro=B(0);b.cir=B(1);b.sqr=B(2);b.tri=B(3);b.l1=B(4);b.r1=B(5);b.sha=B(8);b.opt=B(9);b.l3=B(10);b.r3=B(11);b.ps=B(16);b.tp=B(17);
 S.l2=gp.buttons[6]?gp.buttons[6].value:0;S.r2=gp.buttons[7]?gp.buttons[7].value:0;
 S.d.u=B(12);S.d.d=B(13);S.d.l=B(14);S.d.r=B(15);return true}

/* ---- WebHID: gyro / accel fusion ---- */
const q=new T.Quaternion(),qi=new T.Quaternion(),dq=new T.Quaternion(),UP=V(0,1,0),ax=V(0,0,0);
let bias=[0,0,0],calN=0,calS=[0,0,0],cal=true,lastTs=null,dps=0;
const flip=()=>[$('fx').checked?-1:1,$('fy').checked?-1:1,$('fz').checked?-1:1];
function onReport(e){const id=e.reportId,dv=e.data,o=id===1?0:id===0x11?2:-1;if(o>=0)lastId=id;if(o<0||dv.byteLength<o+38)return;
 const u=i=>dv.getUint8(o+i),s=i=>dv.getInt16(o+i,true),b=S.b;
 S.lx=(u(0)-127.5)/127.5;S.ly=(u(1)-127.5)/127.5;S.rx=(u(2)-127.5)/127.5;S.ry=(u(3)-127.5)/127.5;
 const b1=u(4),b2=u(5),b3=u(6),h=b1&15;
 b.sqr=!!(b1&16);b.cro=!!(b1&32);b.cir=!!(b1&64);b.tri=!!(b1&128);
 b.l1=!!(b2&1);b.r1=!!(b2&2);b.sha=!!(b2&16);b.opt=!!(b2&32);b.l3=!!(b2&64);b.r3=!!(b2&128);b.ps=!!(b3&1);b.tp=!!(b3&2);
 S.l2=u(7)/255;S.r2=u(8)/255;
 S.d.u=h==7||h==0||h==1;S.d.r=h>=1&&h<=3;S.d.d=h>=3&&h<=5;S.d.l=h>=5&&h<=7;
 [[34,0],[38,1]].forEach(([c,n])=>{const t=S.t[n];t.a=!(u(c)&128);t.x=u(c+1)|((u(c+2)&15)<<8);t.y=(u(c+2)>>4)|(u(c+3)<<4)});
 const ts=dv.getUint16(o+9,true);let dt=lastTs===null?.004:((ts-lastTs)&0xffff)*5.33e-6;lastTs=ts;DG.tick(dt);DG.btn(performance.now());if(dt<=0||dt>.05)dt=.004;
 const g=[s(12),s(14),s(16)],a=[s(18),s(20),s(22)];
 if(cal){calS[0]+=g[0];calS[1]+=g[1];calS[2]+=g[2];DG.cs(g,a);if(++calN>=150){bias=calS.map(v=>v/calN);DG.gyro();cal=false;const an=Math.hypot(...a)||1;q.setFromUnitVectors(V(a[0]/an,a[1]/an,a[2]/an),UP);st('Gyro live · 60 fps render · '+(e.target.productName||'DualShock 4'))}return}
 if(Math.abs(g[0]-bias[0])<25&&Math.abs(g[1]-bias[1])<25&&Math.abs(g[2]-bias[2])<25)for(let i=0;i<3;i++)bias[i]+=(g[i]-bias[i])*.002;
 const f=flip(),k=.0010653;let w=[(g[0]-bias[0])*k*f[0],(g[1]-bias[1])*k*f[1],(g[2]-bias[2])*k*f[2]];dps=Math.hypot(...w)*57.3;
 const an=Math.hypot(...a);
 if(Math.abs(an-8192)<2200){const x=a[0]/an,y=a[1]/an,z=a[2]/an,v=UP.clone().applyQuaternion(qi.copy(q).invert());
  w[0]+=2*(y*v.z-z*v.y);w[1]+=2*(z*v.x-x*v.z);w[2]+=2*(x*v.y-y*v.x)}
 const m=Math.hypot(...w);if(m>1e-6){ax.set(w[0]/m,w[1]/m,w[2]/m);dq.setFromAxisAngle(ax,m*dt);q.multiply(dq).normalize()}}
async function openDev(d){if(!d.opened)await d.open();try{await d.receiveFeatureReport(2)}catch(e){}
 dev=d;d.oninputreport=onReport;hid=true;cal=true;calN=0;calS=[0,0,0];lastTs=null;st('Calibrating gyro… keep the controller still for a second.')}
$('bc').onclick=async()=>{if(!navigator.hid){st('WebHID unavailable here. Use desktop Chrome/Edge and open the page in its own tab.');return}
 try{const ds=await navigator.hid.requestDevice({filters:[{vendorId:0x54c,productId:0x5c4},{vendorId:0x54c,productId:0x9cc},{vendorId:0x54c,productId:0xba0}]});if(ds[0])await openDev(ds[0])}catch(e){st('HID: '+e.message)}};
if(navigator.hid){navigator.hid.getDevices().then(ds=>{const d=ds.find(x=>x.vendorId==0x54c);if(d)openDev(d).catch(()=>{})}).catch(()=>{});
 navigator.hid.addEventListener('disconnect',()=>{hid=false;dev=null;st('Controller disconnected.')})}
$('br').onclick=()=>{const e=new T.Euler().setFromQuaternion(q,'YXZ');e.y=0;q.setFromEuler(e)};
$('bk').onclick=()=>{if(hid){cal=true;calN=0;calS=[0,0,0];st('Calibrating gyro… keep the controller still.')}};
let xr=false;$('xr').onclick=()=>{xr=!xr;FM.visible=!xr};
addEventListener('gamepadconnected',e=>{if(!hid)st('Controller detected: buttons and sticks live. Click Connect for gyro.')});

/* ---- apply state to model ---- */
function apply(){const b=S.b,d=S.d;
 [[sL,S.lx,S.ly,b.l3],[sR,S.rx,S.ry,b.r3]].forEach(([s,x,y,p])=>{s.piv.rotation.z=-x*.42;s.piv.rotation.x=y*.42;s.g.position.y=TOP-(p?.2:0)});
 for(const k in FB)FB[k].position.y=TOP-(b[k]?.16:0);
 dpv.rotation.x=(d.d?.12:0)-(d.u?.12:0);dpv.rotation.z=(d.l?.12:0)-(d.r?.12:0);
 SH.position.y=TOP+.1-(b.sha?.08:0);OP.position.y=TOP+.1-(b.opt?.08:0);PS.position.y=TOP-(b.ps?.1:0);
 L1.rotation.x=b.l1?-.14:0;R1.rotation.x=b.r1?-.14:0;L2.rotation.x=-.45*S.l2;R2.rotation.x=-.45*S.r2;
 tp.position.y=TOP-(b.tp?.08:0);
 S.t.forEach((t,i)=>{const d=tdots[i];d.visible=t.a;if(t.a)d.position.set((t.x/1920-.5)*5.7,.22,(t.y/942-.5)*2.4)})}

/* ---- rockets, rumble, dust, sound ---- */
let lastId=1;const rn=()=>Math.random()-.5;
Object.values(FB).forEach(b=>loop(pts(.66,28,TOP+.01).map(p=>V(p.x+b.position.x,TOP+.01,p.z+b.position.z)),ctrl,DM));
{const g=G(-1.2,-.3,3.88);g.rotation.x=Math.PI/2;loop(pts(.22,20),g);loop(pts(.12,16),g,DM)}
{const g=G(.7,-.3,3.88);g.rotation.x=Math.PI/2;loop([V(-.7,0,-.17),V(.7,0,-.17),V(.7,0,.17),V(-.7,0,.17)],g)}
const FWD=V(0,0,1);
const NZ=[-1,1].map(s=>{const g=G(s*5.05,-1,7.26),cr=(r,z,m)=>loop(pts(r,32).map(p=>V(p.x,p.z,z)),g,m);
 const lg=new T.LatheGeometry([[.7,.06],[.68,0],[.58,-.14],[.45,-.4],[.31,-.72],[.28,-.9],[.36,-1.2],[.42,-1.5]].map(p=>new T.Vector2(p[0],p[1])),32);lg.rotateX(Math.PI/2);mk(lg,g,40);
 cr(.7,.06);cr(.82,.02,DM);cr(.95,-.12,DM);[[.58,-.14],[.45,-.4],[.31,-.72],[.28,-.9]].forEach(q=>cr(q[0],q[1],DM));
 const m=[];for(let a=0;a<8;a++){const c=Math.cos(a*.7854),n=Math.sin(a*.7854),P=(r,z)=>V(r*c,r*n,z);[[.68,0,.45,-.4],[.45,-.4,.31,-.72],[.31,-.72,.28,-.9],[.28,-.9,.36,-1.2]].forEach(q=>m.push(P(q[0],q[1]),P(q[2],q[3])));m.push(P(.82,.02),P(1.05,-.9))}seg(m,g,DM);
 const gl=new T.Mesh(new T.CircleGeometry(.42,24),new T.MeshBasicMaterial({color:0x66aaff,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));gl.position.z=-.55;g.add(gl);
 return{g,gl,dir:V(0,0,1),tgt:V(0,0,1)}});
function PSys(n,core=0){const p=new Float32Array(n*3),v=new Float32Array(n*3),c=new Float32Array(n*3),l=new Float32Array(n),ml=new Float32Array(n).fill(1),sz=new Float32Array(n),al=new Float32Array(n),b=new Float32Array(n);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('aC',new T.BufferAttribute(c,3));g.setAttribute('aS',new T.BufferAttribute(sz,1));g.setAttribute('aA',new T.BufferAttribute(al,1));
 const m=new T.ShaderMaterial({uniforms:{uCore:{value:core}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,
  vertexShader:'attribute float aS;attribute float aA;attribute vec3 aC;varying float vA;varying vec3 vC;void main(){vA=aA;vC=aC;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=aS*(30./-mv.z);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uCore;varying float vA;varying vec3 vC;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;vec3 c=mix(vC,vec3(.75,.9,1.),pow(vA,3.)*uCore*.55);float g=uCore>.5?.4:1.;gl_FragColor=vec4(c,vA*(1.-d*d)*g);}'});
 const pt=new T.Points(g,m);pt.frustumCulled=false;scene.add(pt);let h=0;
 return{emit(x,y,z,vx,vy,vz,life,size,r=1,gg=1,bb=1){const i=h;h=(h+1)%n;p.set([x,y,z],i*3);v.set([vx,vy,vz],i*3);c.set([r,gg,bb],i*3);l[i]=ml[i]=life;b[i]=size},
  step(dt,drag,grav,tb=0){for(let i=0;i<n;i++){if(l[i]<=0)continue;l[i]-=dt;if(l[i]<=0){al[i]=0;sz[i]=0;continue}const k=l[i]/ml[i],f=Math.max(0,1-drag*dt);
   v[i*3]=v[i*3]*f+(tb?rn()*tb*dt:0);v[i*3+1]=v[i*3+1]*f+grav*dt+(tb?rn()*tb*dt:0);v[i*3+2]=v[i*3+2]*f+(tb?rn()*tb*dt:0);p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;al[i]=k;sz[i]=b[i]*(.4+k)}
   g.attributes.position.needsUpdate=g.attributes.aC.needsUpdate=g.attributes.aS.needsUpdate=g.attributes.aA.needsUpdate=true}}}
function LSys(n){const p=new Float32Array(n*6),c=new Float32Array(n*8),h=new Float32Array(n*3),v=new Float32Array(n*3),cc=new Float32Array(n*3),l=new Float32Array(n),ml=new Float32Array(n).fill(1),g=new T.BufferGeometry();
 g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('aC',new T.BufferAttribute(c,4));
 const o=new T.LineSegments(g,new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:'attribute vec4 aC;varying vec4 vC;void main(){vC=aC;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec4 vC;void main(){gl_FragColor=vC;}'}));o.frustumCulled=false;scene.add(o);let k=0;
 return{emit(x,y,z,vx,vy,vz,life,r,gg,b){const i=k;k=(k+1)%n;h.set([x,y,z],i*3);v.set([vx,vy,vz],i*3);cc.set([r,gg,b],i*3);l[i]=ml[i]=life},
  step(dt,drag,tb){const f=Math.max(0,1-drag*dt);for(let i=0;i<n;i++){const o=i*6,q=i*8,w=i*3;if(l[i]<=0){if(c[q+3])c[q+3]=c[q+7]=0;continue}
   l[i]-=dt;const a=Math.pow(Math.max(0,l[i]/ml[i]),.6);
   for(let d=0;d<3;d++){v[w+d]=v[w+d]*f+rn()*tb*dt;h[w+d]+=v[w+d]*dt;p[o+d]=h[w+d];p[o+3+d]=h[w+d]-v[w+d]*.06;c[q+d]=c[q+4+d]=cc[w+d]}c[q+3]=a;c[q+7]=0}
   g.attributes.position.needsUpdate=g.attributes.aC.needsUpdate=true}}}
const fire=PSys(22000,1),dust=PSys(900),spark=PSys(1400),streak=LSys(6000);
let tL=0,tR=0,kL=0,kR=0,pb={},lastT=performance.now(),lt2=[null,null],sending=false,sentAt=0,lastSent='';
const CT=new Uint32Array(256).map((_,n)=>{for(let k=0;k<8;k++)n=n&1?0xEDB88320^(n>>>1):n>>>1;return n>>>0});
function crc(a){let c=-1;for(const x of [0xA2,0x11,...a])c=CT[(c^x)&255]^(c>>>8);return(~c)>>>0}
async function sendFx(strong,weak,rgb){if(!hid||!dev||sending)return;const bt=lastId===0x11,d=new Uint8Array(bt?77:31);
 if(bt){d[0]=0xC0;d[1]=0x20;d[2]=7;d[5]=weak;d[6]=strong;d[7]=rgb[0];d[8]=rgb[1];d[9]=rgb[2];const c=crc(d.subarray(0,73));d[73]=c&255;d[74]=c>>8&255;d[75]=c>>16&255;d[76]=c>>>24}
 else{d[0]=7;d[3]=weak;d[4]=strong;d[5]=rgb[0];d[6]=rgb[1];d[7]=rgb[2]}
 sending=true;try{await dev.sendReport(bt?0x11:5,d)}catch(e){}sending=false}
let ac,ns=[];function audio(){if(ac){if(ac.state=='suspended')ac.resume();return}if(!$('sn').checked)return;ac=new(window.AudioContext||window.webkitAudioContext)();
 const buf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),a=buf.getChannelData(0);let l=0;for(let i=0;i<a.length;i++){l=(l+.02*(Math.random()*2-1))/1.02;a[i]=l*3.5}
 nbuf=buf;ns=[-1,1].map(p=>{const s=ac.createBufferSource();s.buffer=buf;s.loop=true;const f=ac.createBiquadFilter();f.type='lowpass';const g=ac.createGain();g.gain.value=0;const pn=ac.createStereoPanner();pn.pan.value=p;s.connect(f);f.connect(g);g.connect(pn);pn.connect(ac.destination);s.start();return{f,g}})}
addEventListener('pointerdown',audio);addEventListener('keydown',audio);
const FN={tri:880,cir:660,cro:520,sqr:740},DD={u:[V(0,0,-1),659.25],r:[V(1,0,0),783.99],d:[V(0,0,1),523.25],l:[V(-1,0,0),587.33]};
let nbuf,sgL=0,sgR=0,hs=0,hw=0,psA=0,lbF=0;const lbFC=new T.Color(1,1,1),lbc=new T.Color(0,.3,1),BLU=new T.Color(0,.3,1),HOT=new T.Color(.5,.8,1),dz=v=>Math.abs(v)<.1?0:v,wd=(o,v)=>v.clone().transformDirection(o.matrixWorld);
function tone(f0,f1,dur,type,gain){if(!ac||!$('sn').checked)return;const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+dur+.02)}
function boom(pan){if(!ac||!nbuf||!$('sn').checked)return;const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain(),p=ac.createStereoPanner(),t=ac.currentTime;s.buffer=nbuf;s.connect(f);f.connect(g);g.connect(p);p.connect(ac.destination);
 f.type='lowpass';f.frequency.setValueAtTime(5000,t);f.frequency.exponentialRampToValueAtTime(200,t+.35);g.gain.setValueAtTime(1.8,t);g.gain.exponentialRampToValueAtTime(.001,t+.45);p.pan.value=pan;s.start(t,Math.random());s.stop(t+.5);tone(110,35,.4,'sine',1)}
function wave(i){const w=WV[wi=(wi+1)%NW];w.a=0;w.o.set(i?5.3:-5.3,1.75,-2.7);lbF=1;lbFC.set(0xffffff);hs=hw=.5;tone(260,45,.55,'sine',.7);tone(1400,300,.25,'sawtooth',.04)}
function pop(k){const o=FB[k].localToWorld(V(0,.3,0)),u=wd(ctrl,V(0,1,0)),c=new T.Color(FC[k]);
 for(let i=0;i<40;i++){const a=Math.random()*6.283,rr=2+Math.random()*4,sp=3+Math.random()*6,r1=wd(ctrl,V(Math.cos(a),0,Math.sin(a)));
  spark.emit(o.x,o.y,o.z,r1.x*rr+u.x*sp,r1.y*rr+u.y*sp,r1.z*rr+u.z*sp,.5+Math.random()*.6,2.5+Math.random()*3,c.r,c.g,c.b)}
 for(let i=0;i<3;i++)spark.emit(o.x,o.y,o.z,u.x,u.y,u.z,.28,16,c.r*.7,c.g*.7,c.b*.7);
 lbF=.8;lbFC.copy(c);hw=Math.max(hw,.5);tone(FN[k],FN[k]*.6,.14,'triangle',.12)}
function dping(k){const [dl,f]=DD[k],o=dp.localToWorld(dl.clone().multiplyScalar(1.1).setY(.35)),w=wd(ctrl,dl),c=dp.localToWorld(V(0,.35,0));
 for(let i=0;i<30;i++){const sp=5+Math.random()*9;spark.emit(o.x,o.y,o.z,w.x*sp+rn()*3,w.y*sp+rn()*3+1,w.z*sp+rn()*3,.5+Math.random()*.4,2.5+Math.random()*2,.55,.9,1)}
 for(let i=0;i<48;i++){const a=i/48*6.283,r1=wd(ctrl,V(Math.cos(a),0,Math.sin(a)));spark.emit(c.x,c.y,c.z,r1.x*7,r1.y*7,r1.z*7,.45,2.6,.4,.8,1)}
 hs=Math.max(hs,.35);tone(f,f,.45,'sine',.18);tone(f*2,f*2,.3,'triangle',.05)}
function psHit(){psA=1.4;lbF=1;lbFC.set(0xffffff);hs=hw=.6;tone(523,523,.6,'sine',.12);setTimeout(()=>tone(784,784,.7,'sine',.12),90);setTimeout(()=>tone(1046,1046,.9,'sine',.1),190)}
/* ---- diagnostics: measures the real controller, explains it in plain words ---- */
const BN=[['cro','×'],['cir','○'],['sqr','□'],['tri','△'],['l1','L1'],['r1','R1'],['l3','L3 (stick click)'],['r3','R3 (stick click)'],['sha','Share'],['opt','Options'],['ps','PS'],['tp','Touchpad click'],['du','D-pad up'],['dd','D-pad down'],['dl','D-pad left'],['dr','D-pad right']];
const DG={on:false,bt:{},hic:[],m:.004,v:0,pn:0,t:0,tpc:new Uint8Array(72),g:null,cq:[0,0,0],ca:0,txt:'',
 sd:[0,1].map(()=>({bin:new Float32Array(24),win:[],rest:null})),tr:[0,1].map(()=>({mn:9,mx:0,n:0})),
 tick(dt){if(dt>0&&dt<1){DG.pn++;DG.m+=(dt-DG.m)*.01;DG.v+=((dt-DG.m)**2-DG.v)*.01}if(dt>.025)DG.hic.push(performance.now())},
 btn(now){BN.forEach(([k])=>{const v=!!(k.length==2&&k[0]=='d'?S.d[k[1]]:S.b[k]),o=DG.bt[k]||(DG.bt[k]={on:0,n:0,ch:0,rel:-1e9,pt:0});
  if(v&&!o.on){o.n++;o.pt=now;if(hid&&now-o.rel<30)o.ch++}if(!v&&o.on){o.rel=now;if(hid&&now-o.pt<12)o.ch++}o.on=v});
  S.t.forEach(t=>{if(t.a)DG.tpc[Math.min(11,t.x/160|0)+12*Math.min(5,t.y/157|0)]=1})},
 cs(g,a){if(!calN){DG.cq=[0,0,0];DG.ca=0;DG.g=null}for(let i=0;i<3;i++)DG.cq[i]+=g[i]*g[i];DG.ca+=Math.hypot(...a)},
 gyro(){const n=calN,vr=DG.cq.map((q,i)=>q/n-(calS[i]/n)**2);DG.g={b:Math.max(...bias.map(Math.abs))*.061,nz:Math.sqrt(Math.max(0,(vr[0]+vr[1]+vr[2])/3))*.061,gr:DG.ca/n/8192}}};
const DIR=['left','up-left','up','up-right','right','down-right','down','down-left'];
function diagItems(){const I=[],add=(k,lv,t)=>I.push({k,lv,t});
 ['Left','Right'].forEach((nm,i)=>{const sd=DG.sd[i],r=sd.rest;
  if(!r)add(nm+' stick · drift',0,'Let go of the stick and hold still for 2 seconds.');
  else{const off=Math.hypot(r.x,r.y)*100,sp=Math.round(off*1.275),jt=r.j*100>1.5;
   add(nm+' stick · drift',Math.max(off<=4?1:off<=10?2:3,jt?2:0),'Rests '+off.toFixed(1)+'% off center ('+sp+' of 127 steps). '+(off<=4?'No drift.':off<=10?'Small drift. Most games hide it with a deadzone, but games with a tiny deadzone may creep.':'That is real stick drift. Clean around the stick or replace the stick module.')+(jt?' The reading is also jumpy (sensor noise).':''))}
  const cov=[...sd.bin].filter(x=>x>.55).length;
  if(cov<20)add(nm+' stick · range',0,'Roll the stick slowly around its full edge ('+cov+'/24 directions seen).');
  else{let mi=9,mb=0,sum=0;sd.bin.forEach((x,b)=>{sum+=x;if(x<mi){mi=x;mb=b}});const d=DIR[Math.round(((mb+.5)/24*6.2832)/6.2832*8)%8],av=Math.round(sum/24*100),m=Math.round(mi*100);
   add(nm+' stick · range',mi>=.88?1:mi>=.78?2:3,mi>=.88?'Reaches '+av+'% of full travel in every direction (weakest '+m+'%).':'Only reaches '+m+'% toward '+d+'. '+(mi>=.78?'Push harder there; if it stays low the stick is worn.':'Something blocks it: dirt, a worn gate or a damaged stick.'))}});
 ['L2','R2'].forEach((nm,i)=>{const t=DG.tr[i];
  if(t.mx<.5)add(nm+' trigger',0,'Pull it all the way down, then let go.');
  else if(t.mn>.04)add(nm+' trigger',2,'Never returns to 0: rests at '+Math.round(t.mn*100)+'%. Games may think it is slightly pressed.');
  else if(t.mx<.92)add(nm+' trigger',2,'Tops out at '+Math.round(t.mx*100)+'%. It cannot reach a full press.');
  else add(nm+' trigger',1,'Rests at 0% and reaches '+Math.round(t.mx*100)+'%. Works fully.')});
 const tested=BN.filter(([k])=>DG.bt[k]&&DG.bt[k].n),bad=BN.filter(([k])=>DG.bt[k]&&DG.bt[k].ch),left=BN.filter(([k])=>!(DG.bt[k]&&DG.bt[k].n));
 if(bad.length)add('Buttons',2,bad.map(x=>x[1]).join(', ')+' fired a double or phantom press. A worn switch can double-click; clean or replace it.'+(left.length?' Still untested: '+left.map(x=>x[1]).join(', ')+'.':''));
 else if(left.length)add('Buttons',0,tested.length+' of 16 pressed. Left: '+left.map(x=>x[1]).join(', ')+'.'+(hid?'':' (Double-press detection needs Connect.)'));
 else add('Buttons',1,'All 16 work with no double-presses.');
 if(!hid)add('Touchpad area',0,'Click Connect (WebHID) to test the touchpad surface.');
 else{const c=DG.tpc.reduce((a,b)=>a+b,0);add('Touchpad area',c>=70?1:0,c<8?'Swipe a finger across the whole pad.':c>=70?'Every area of the pad responds ('+Math.round(c/72*100)+'%).':'Covered '+Math.round(c/72*100)+'%. Keep swiping: dark cells have not registered yet.')}
 if(!hid)add('Connection',0,'Using the browser gamepad API. Click Connect (WebHID) for polling rate, gyro, touchpad and button double-press tests.');
 else{const h=DG.hic.filter(x=>performance.now()-x<6e4).length,hz=1/DG.m,j=Math.sqrt(DG.v)*1e3;
  add('Connection',DG.pn<300?0:hz<60||h>3?3:h>0?2:1,DG.pn<300?'Measuring…':Math.round(hz)+' Hz, steady within '+j.toFixed(1)+' ms, '+h+' hiccup'+(h==1?'':'s')+' in the last minute. '+(hz<60?'That is slow; try a cable.':h>3?'Lots of dropped reports: move closer, or use a cable.':h>0?'A few drops, likely wireless interference.':'Smooth.'))}
 const g=DG.g;
 if(!hid||!g)add('Gyro & accelerometer',0,hid?'Calibrating… keep it still.':'Click Connect (WebHID), then keep the controller still.');
 else{const w=[];if(g.nz>1)w.push('It was moving, or the gyro is noisy ('+g.nz.toFixed(2)+'°/s). Set it down and press Recalibrate.');if(g.b>10)w.push('Large resting offset ('+g.b.toFixed(1)+'°/s); cancelled in software but a sign of a worn sensor.');if(Math.abs(g.gr-1)>.12)w.push('Gravity reads '+Math.round(g.gr*100)+'% of normal; the accelerometer is off.');
  add('Gyro & accelerometer',w.length?2:1,w.length?w.join(' '):'Still noise '+g.nz.toFixed(2)+'°/s, offset '+g.b.toFixed(1)+'°/s, gravity '+Math.round(g.gr*100)+'%. All normal.')}
 return I}
function drawS(i){const c=$('cs'+i).getContext('2d'),m=52,R=46,sd=DG.sd[i];c.clearRect(0,0,104,104);c.strokeStyle='#555';c.beginPath();c.arc(m,m,R,0,6.2832);c.moveTo(m-R,m);c.lineTo(m+R,m);c.moveTo(m,m-R);c.lineTo(m,m+R);c.stroke();
 c.strokeStyle='#fff';c.beginPath();for(let k=0;k<=24;k++){const b=k%24,a=(b+.5)/24*6.2832-Math.PI,r=Math.min(1.1,sd.bin[b])*R;c[k?'lineTo':'moveTo'](m+Math.cos(a)*r,m+Math.sin(a)*r)}c.stroke();
 if(sd.rest){c.strokeStyle='#f55';c.strokeRect(m+sd.rest.x*R-2,m+sd.rest.y*R-2,4,4)}c.fillStyle='#fff';c.fillRect(m+(i?S.rx:S.lx)*R-2,m+(i?S.ry:S.ly)*R-2,5,5);c.fillText(i?'R':'L',3,10)}
function drawT(){const c=$('ctp').getContext('2d');c.clearRect(0,0,150,76);c.fillStyle='rgba(255,255,255,.45)';DG.tpc.forEach((v,k)=>{if(v)c.fillRect(k%12*12.5+1,(k/12|0)*12.5+1,11,11)});c.strokeStyle='#555';c.strokeRect(.5,.5,149,75);c.fillStyle='#fff';S.t.forEach(t=>{if(t.a)c.fillRect(t.x/1920*150-2,t.y/942*75-2,5,5)})}
$('dg').innerHTML='<b>CONTROLLER CHECK</b><div id=dgH></div><div id=dgG></div><canvas id=cs0 width=104 height=104></canvas><canvas id=cs1 width=104 height=104></canvas><canvas id=ctp width=150 height=76></canvas><div id=dgI></div><button id=dr>Reset tests</button><button id=dc>Copy report</button>';
$('dr').onclick=()=>{DG.sd.forEach(x=>{x.bin.fill(0);x.win=[];x.rest=null});DG.tr.forEach(t=>{t.mn=9;t.mx=0;t.n=0});DG.bt={};DG.tpc.fill(0);DG.hic=[]};
$('dc').onclick=async()=>{try{await navigator.clipboard.writeText(DG.txt);st('Report copied.')}catch(e){st('Copy blocked here; select the text manually.')}};
function diag(now){if(!hid)DG.btn(now);
 [[S.lx,S.ly],[S.rx,S.ry]].forEach(([x,y],i)=>{const sd=DG.sd[i],r=Math.hypot(x,y),bi=Math.floor((Math.atan2(y,x)+Math.PI)/6.2832*24)%24;if(r>sd.bin[bi])sd.bin[bi]=r;
  sd.win.push([now,x,y]);while(now-sd.win[0][0]>1500)sd.win.shift();const w=sd.win;
  if(w.length>20&&now-w[0][0]>1400){const n=w.length,mx=w.reduce((a,p)=>a+p[1],0)/n,my=w.reduce((a,p)=>a+p[2],0)/n,rx=Math.max(...w.map(p=>p[1]))-Math.min(...w.map(p=>p[1])),ry=Math.max(...w.map(p=>p[2]))-Math.min(...w.map(p=>p[2]));
   if(rx<.05&&ry<.05&&Math.hypot(mx,my)<.3)sd.rest={x:mx,y:my,j:Math.sqrt(w.reduce((a,p)=>a+(p[1]-mx)**2+(p[2]-my)**2,0)/n)}}});
 [S.l2,S.r2].forEach((v,i)=>{const t=DG.tr[i];if(++t.n>20){t.mn=Math.min(t.mn,v);t.mx=Math.max(t.mx,v)}});
 drawS(0);drawS(1);drawT();if(now-DG.t<300)return;DG.t=now;
 const I=diagItems(),c=[0,0,0,0];I.forEach(x=>c[x.lv]++);const done=I.length-c[0];
 $('dgH').innerHTML=!DG.on?'<span class=g0>No controller detected. Plug in or pair one and press a button.</span>':c[3]?'<span class=g3>✗ '+c[3]+' problem'+(c[3>1?3:3]>1?'s':'')+' found</span>':c[2]?'<span class=g2>! '+c[2]+' thing'+(c[2]>1?'s':'')+' worth watching</span>':done?'<span class=g1>✓ Healthy so far</span>':'<span class=g0>Ready. Follow the steps below.</span>';
 const sd=DG.sd,gd=!sd[0].rest||!sd[1].rest?'Step 1: let go of both sticks and hold still for 2 seconds.':I.some(x=>/range/.test(x.k)&&x.lv==0)?'Step 2: roll each stick slowly around its full edge.':I.some(x=>/trigger/.test(x.k)&&x.lv==0)?'Step 3: pull L2 and R2 all the way down, then release.':I.find(x=>x.k=='Buttons').lv==0?'Step 4: press every button once.':hid&&I.find(x=>x.k=='Touchpad area').lv==0?'Step 5: swipe a finger across the whole touchpad.':'All steps done. Tests stay live while you use it.';
 $('dgG').textContent=gd;$('dgI').innerHTML=I.map(x=>'<div class=it><span class=g'+x.lv+'>'+'○✓!✗'[x.lv]+'</span> <span class=k>'+x.k+'</span><div class=t>'+x.t+'</div></div>').join('');
 DG.txt='DS4 diagnostics '+new Date().toISOString().slice(0,10)+'\n'+I.map(x=>'○✓!✗'[x.lv]+' '+x.k+': '+x.t).join('\n')}
function fx(now){const dt=Math.min(.05,(now-lastT)/1000)||.016;lastT=now;const b=S.b,d=S.d,t=now/1000,ex=Math.exp,ev=(k,v)=>{const r=!!v&&!pb[k];pb[k]=!!v;return r};
 const sk=[[dz(S.lx),dz(S.ly)],[dz(S.rx),dz(S.ry)]];
 const tl=Math.min(1,S.l2+Math.hypot(...sk[0])*.25),tr=Math.min(1,S.r2+Math.hypot(...sk[1])*.25);
 tL+=(tl-tL)*Math.min(1,dt*(tl>tL?25:5));tR+=(tr-tR)*Math.min(1,dt*(tr>tR?25:5));
 hs*=ex(-dt*7);hw*=ex(-dt*7);psA*=ex(-dt*1.6);lbF*=ex(-dt*3);
 WV.forEach((w,i)=>{w.a+=dt;WU.uO.value[i].copy(w.o);WU.uR.value[i]=w.a*22;WU.uA.value[i]=Math.pow(Math.max(0,1-w.a/.95),.7)});
 NZ.forEach((n,i)=>{n.tgt.set(sk[i][0]*.95,-sk[i][1]*.95,1).normalize();n.dir.lerp(n.tgt,Math.min(1,dt*16)).normalize();n.g.quaternion.setFromUnitVectors(FWD,n.dir)});
 const sh=(tL+tR)*.5;rig.position.set(rn()*.14*sh,rn()*.14*sh,rn()*.14*sh);rig.updateMatrixWorld(true);
 // per-control demonstrations
 if(ev('l1',b.l1))wave(0);if(ev('r1',b.r1))wave(1);if(ev('ps',b.ps))psHit();
 if(ev('sha',b.sha))$('xr').click();if(ev('opt',b.opt))$('br').click();
 ['u','r','d','l'].forEach(k=>{if(ev('d'+k,d[k]))dping(k)});
 for(const k in FB){if(ev(k,b[k]))pop(k);fgl[k]+=((b[k]?1:0)-fgl[k])*Math.min(1,dt*(b[k]?30:6));FG[k].opacity=fgl[k]*.85;FG[k+'r'].opacity=fgl[k];
  if(b[k]){const o=FB[k].localToWorld(V(0,.3,0)),u=wd(ctrl,V(0,1,0)),c=new T.Color(FC[k]);spark.emit(o.x+rn()*.5,o.y,o.z+rn()*.5,u.x*2+rn(),u.y*2+rn(),u.z*2+rn(),.5,2.5,c.r,c.g,c.b)}}
 LGM.opacity=Math.min(1,psA);
 // thrusters: R2/L2 push, sticks vector
 NZ.forEach((n,i)=>{const th=i?tR:tL,t2=th*th,cnt=th>.02?th*(1500+t2*6500)*dt+Math.random():0,dw=wd(n.g,FWD);n.gl.material.opacity=Math.min(1,th*1.2);
  for(let c=0;c<cnt;c++){const sp=6+th*26+t2*14+Math.random()*8,a=Math.random()*6.283,rr=Math.random()*.5,o=n.g.localToWorld(V(Math.cos(a)*rr,Math.sin(a)*rr,.3)),j=sp*(.12+t2*.4),h=Math.random(),cl=th>.55&&h<(th-.55)*1.6?[1,.5+Math.random()*.3,.12]:h>.93?[.9,.95,1]:[.1,.32,1];
   fire.emit(o.x,o.y,o.z,dw.x*sp+rn()*j,dw.y*sp+rn()*j,dw.z*sp+rn()*j,.45+Math.random()*(.5+t2*1.3),10+th*14+t2*30*Math.random(),cl[0],cl[1],cl[2])}
  const lc=th>.1?th*(250+t2*1500)*dt+Math.random():0;
  for(let c=0;c<lc;c++){const sp=12+th*40+Math.random()*20+t2*20,a=Math.random()*6.283,rr=Math.random()*.6,o=n.g.localToWorld(V(Math.cos(a)*rr,Math.sin(a)*rr,.2)),j=sp*(.1+t2*.45),cl=Math.random()<.5?[.4,.7,1]:th>.6?[1,.6,.2]:[.8,.9,1];
   streak.emit(o.x,o.y,o.z,dw.x*sp+rn()*j,dw.y*sp+rn()*j,dw.z*sp+rn()*j,.3+Math.random()*(.4+t2*.9),cl[0],cl[1],cl[2])}});
 {const m2=Math.max(tL,tR)**2;fire.step(dt,1.5,0,m2*70);streak.step(dt,1.1,m2*90)}spark.step(dt,1.3,-9);
 let touching=0;S.t.forEach((t,i)=>{if(!t.a){lt2[i]=null;return}touching++;const w=tp.localToWorld(V((t.x/1920-.5)*5.7,.22,(t.y/942-.5)*2.4)),pv=lt2[i],n=pv?Math.max(1,Math.ceil(pv.distanceTo(w)/.1)):1;
  for(let k=0;k<n;k++){const f=pv?(k+1)/n:1,x=pv?pv.x+(w.x-pv.x)*f:w.x,y=pv?pv.y+(w.y-pv.y)*f:w.y,z=pv?pv.z+(w.z-pv.z)*f:w.z;dust.emit(x+rn()*.12,y+.05,z+rn()*.12,rn()*.9,.4+Math.random()*.9,rn()*.9,.7+Math.random()*.9,2+Math.random()*3)}lt2[i]=w});
 dust.step(dt,1.4,.15);
 // motors + light bar
 const mi=[Math.min(1,Math.max(tL,hs)),Math.min(1,Math.max(tR*.9+touching*.08,hw))];
 MT.forEach((m,i)=>{const v=mi[i];m.ang+=(v>.02?4+v*(i?40:34):0)*dt;m.sp.rotation.z=m.ang;m.sr.opacity=v*.7;m.g.position.x=m.bx+rn()*.06*v;m.g.position.y=m.by+rn()*.06*v});
 const mx=Math.max(tL,tR);lbc.copy(BLU).multiplyScalar(.5+.3*Math.sin(t*1.6)).lerp(HOT,Math.min(1,mx*1.2)).lerp(lbFC,Math.min(1,lbF));
 LBM.color.copy(lbc);GLM.color.copy(lbc);GLM.opacity=.3+.5*Math.max(lbF,mx,.3);
 diag(now);
 if(ac)ns.forEach((n,i)=>{const th=i?tR:tL,on=$('sn').checked;n.g.gain.value=on?th*.35:0;n.f.frequency.value=180+th*1400});
 if(hid&&!cal&&now-sentAt>33){const rb=$('rb').checked,s1=rb?Math.round(mi[0]*255):0,wk=rb?Math.round(mi[1]*255):0,rgb=[lbc.r,lbc.g,lbc.b].map(v=>Math.round(Math.min(1,v)*255)),key=[s1>>3,wk>>3,rgb[0]>>3,rgb[1]>>3,rgb[2]>>3].join();
  if(key!==lastSent||now-sentAt>1500){lastSent=key;sentAt=now;sendFx(s1,wk,rgb)}}}
let lt=performance.now(),fc=0,fa=0;
R.setAnimationLoop(now=>{DG.on=hid||pollPad();apply();if(hid&&!cal)rig.quaternion.copy(q);else if(!hid)rig.quaternion.identity();
 fx(now);R.render(scene,cam);fc++;if(now-lt>=500){$('fps').textContent=Math.round(fc*1000/(now-lt))+' fps'+(hid?' · '+dps.toFixed(0)+'°/s':'');fc=0;lt=now}});
