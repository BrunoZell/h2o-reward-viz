export default {
    build: {
      target: "esnext"
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "esnext"
      }
    },
    define: {
      "process.env": {}
    }
  };
  