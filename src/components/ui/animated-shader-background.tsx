import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const AnimatedShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get a WebGL context manually so we can reuse it (avoids context limit)
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' })
      ?? canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        context: gl as WebGLRenderingContext,
        antialias: false,
        alpha: false,
        powerPreference: 'low-power',
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        iTime:       { value: 0 },
        iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float iTime;
        uniform vec2  iResolution;
        #define NUM_OCTAVES 3

        float rand(vec2 n) {
          return fract(sin(dot(n, vec2(12.9898,4.1414))) * 43758.5453);
        }
        float noise(vec2 p) {
          vec2 ip = floor(p), u = fract(p);
          u = u*u*(3.0-2.0*u);
          return mix(mix(rand(ip),rand(ip+vec2(1,0)),u.x),mix(rand(ip+vec2(0,1)),rand(ip+vec2(1,1)),u.x),u.y);
        }
        float fbm(vec2 x) {
          float v=0.0,a=0.3;
          vec2 shift=vec2(100);
          mat2 rot=mat2(cos(0.5),sin(0.5),-sin(0.5),cos(0.5));
          for(int i=0;i<NUM_OCTAVES;i++){v+=a*noise(x);x=rot*x*2.0+shift;a*=0.4;}
          return v;
        }
        float star(vec2 uv,float scale,float thresh){
          vec2 cell=floor(uv*scale);
          vec2 j=vec2(rand(cell),rand(cell+vec2(7.3,2.1)));
          vec2 pos=(cell+0.2+j*0.6)/scale;
          float d=length(uv-pos)*scale;
          return smoothstep(0.08,0.0,d)*step(thresh,rand(cell+vec2(13.1,5.7)));
        }

        void main(){
          vec2 uv=gl_FragCoord.xy/iResolution.xy;
          vec2 shake=vec2(sin(iTime*1.2)*0.005,cos(iTime*2.1)*0.005);
          vec2 p=((gl_FragCoord.xy+shake*iResolution.xy)-iResolution.xy*0.5)/iResolution.y*mat2(6,-4,4,6);
          vec2 v; vec4 o=vec4(0);
          float f=2.0+fbm(p+vec2(iTime*5.0,0))*0.5;
          for(float i=0.0;i<24.0;i++){
            v=p+cos(i*i+(iTime+p.x*0.08)*0.025+i*vec2(13,11))*3.5+vec2(sin(iTime*3.0+i)*0.003,cos(iTime*3.5-i)*0.003);
            float tn=fbm(v+vec2(iTime*0.5,i))*0.3*(1.0-i/24.0);
            vec4 col=vec4(0.1+0.3*sin(i*0.2+iTime*0.4),0.3+0.5*cos(i*0.3+iTime*0.5),0.7+0.3*sin(i*0.4+iTime*0.3),1);
            o+=col*exp(sin(i*i+iTime*0.8))/length(max(v,vec2(v.x*f*0.015,v.y*1.5)))*(1.0+tn*0.8)*smoothstep(0.0,1.0,i/24.0)*0.6;
          }
          o=tanh(pow(o/100.0,vec4(1.6)))*1.5;
          float s=star(uv,80.0,0.985)*0.9+star(uv,140.0,0.978)*0.7+star(uv,220.0,0.970)*0.55;
          gl_FragColor=vec4(o.rgb+vec3(0.9,0.95,1.0)*s,1.0);
        }
      `,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    let frameId: number;
    let destroyed = false;

    const animate = () => {
      if (destroyed) return;
      material.uniforms.iTime.value += 0.016;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      destroyed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      material.dispose();
      mesh.geometry.dispose();
      // Don't call renderer.dispose() — it would lose the context we manually created
      // Just stop rendering; the canvas stays in the DOM controlled by React
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  );
};

export default AnimatedShaderBackground;
