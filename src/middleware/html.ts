import{exists}from "jsr:@std/fs@0.216/exists";
import { compileDoc, getComponents } from "./utls/components/index.js";

let isError = false;
let errorPath:any;

const html_middleware = async (req:Request, isProd:boolean): Promise<Response> => {
  const app_path = window._app;
  const paths : string = new URL(req.url).pathname.replace(/\/$/, "");
  let src;
  const pathArrays = paths
    .replace("/", "")
    .split("/");

  let tempSrc;
  if (pathArrays.length === 1 && pathArrays[0] !== "") {
    tempSrc = `${app_path}${paths}.html`;
  } else if (pathArrays.length > 1) {
    pathArrays.splice(1, 0, "pages");
    tempSrc = `${app_path}/${pathArrays.join("/")}.html`;
  } else {
    tempSrc = `${app_path}/index.html`;
  }

  const paramArray: string[] = pathArrays;
  paramArray.pop();

  const paramPage = `${app_path}/${paramArray.join("/")}/@.html`;

  src = await exists(tempSrc)
    ? await Deno.readTextFile(tempSrc)
    : await exists(paramPage)
    ? await Deno.readTextFile(paramPage)
    : `<app-head/><div class="w-screen h-screen flex items-center justify-center">To get lost is to learn the way </h1>`;

  const components = getComponents(src);

  if (components && components.length > 0) {
    src = await compileDoc(src, components, paths, isProd, req);
  }

  if (!isProd) {
    src += hmrScript;
  }

  return html_response(src);
};

const getManifest = async (isProd: boolean) => {
  const app_path = window._app;
  let manifest_path = `file:///${app_path}/src/public/manifest.json`;

  if (!Deno.build.os === "windows" && isProd) {
    manifest_path = `app/${app_path}/src/public/manifest.json`;
  } else if (!Deno.build.os === "windows" && !isProd) {
    manifest_path = await import(`${app_path}/src/public/manifest.json`);
  }

  if (exists(manifest_path)) {
    const { default: _manifest } = await import(
      `${window._cwd}/src/public/manifest.json`,
      {
        assert: {
          type: "json",
        },
      }
    );
  }
};

const set_error = () => {
  isError = true;
  return errorPath;
};

export const error_response = () => {
  return html_response(Deno.readFile(errorPath));
};

const hmrScript = `
<script>
// Create WebSocket connection.
const socket = new WebSocket('ws://localhost:8000/hmr');

// Connection opened
socket.addEventListener('open', (event) => {
    socket.send('Start HMR!');
});

 // Listen for error
 socket.addEventListener('close', (event) => {
    console.log('connection close reload')
    setTimeout(() => {
        location.reload()
    },1000)
 
});
</script>
`;

// redirect to 303 error page
const html_response = (res) => {
  // Will check what is up with this HMR
  // ${Deno.env.get('env') ? hmrScript : ''}
  return new Response(`${res}`, {
    headers: {
      "content-type": "text/html",
    },
  });
};

export default html_middleware;
