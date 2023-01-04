import {serve} from "https://deno.land/std@0.167.0/http/server.ts";
import "https://deno.land/std/dotenv/load.ts";

let resp;

const service = async (ext, pathname, req) => {
    resp = null
    if(!resp){
        for (const element of ext) {

            const _resp = await element(pathname, req)
            if(_resp){
                resp = _resp
                break;
            } 
        }
    }
  
}

const middleware = async (request, info) => {
      try {
        
        const { pathname } = new URL(request.url);
   
   
        try{ 
            console.log(Deno.env.get('env'))
            const extensions = Deno.env.get('env') ? await import(`${Deno.cwd()}/extensions.js`) : await import(`${Deno.cwd()}/ext.js`)
            await service(Object.values(extensions),pathname,request)
            return resp
        }catch(err){
          console.log('no extension file',err)
        }
  
   
      
      } catch (err) {
          // look into support for logging service or build own
          // we will send it from here to our custom logger
          let msg = "Internal server error";
      
          // if (err.message.includes("Cannot read properties of undefined ")) {
          //   msg = err.message;
          // }
      
          return Response.json({msg, trace:err.message},{status:500})
      }
}


const port = 8080
serve(middleware, { port });

export default middleware