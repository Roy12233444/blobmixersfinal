module.exports = {
  module: {
    rules: [
      {
        test: /\.(glsl|vs|fs)$/,
        loader: "glslify-loader",
      },
    ],
  },
};
