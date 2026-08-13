export default {
	plugins: {
		// Makes the `@custom-media` breakpoints available to every stylesheet
		// without each one having to import them.
		"@csstools/postcss-global-data": {
			files: ["./src/styles/media.css"],
		},
		"postcss-custom-media": {},
		autoprefixer: {},
	},
};
