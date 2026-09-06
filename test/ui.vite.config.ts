import { mergeConfig } from 'vite';
import base from '../vite.config';
export default mergeConfig(base,{server:{host:'0.0.0.0',port:5173,strictPort:true,proxy:{'/__ui_api':{target:'http://127.0.0.1:8788',changeOrigin:false,rewrite:(path:string)=>path.replace(/^\/__ui_api/,'')}}}});
