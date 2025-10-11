import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  darkMode: "class",
  plugins: [heroui({
		themes: {
			"light": {
				"colors": {
				"primary": {
					"50": "#f8e3ef",
					"100": "#edbbd7",
					"200": "#e394c0",
					"300": "#d86ca9",
					"400": "#ce4592",
					"500": "#c31d7b",
					"600": "#a11865",
					"700": "#7f1350",
					"800": "#5d0e3a",
					"900": "#3b0925",
					"foreground": "#fff",
					"DEFAULT": "#c31d7b"
				},
				"background": "#ffffff",
				"foreground": "#000000",
				"content1": {
					"DEFAULT": "#ffffff",
					"foreground": "#000"
				},
				"content2": {
					"DEFAULT": "#f4f4f5",
					"foreground": "#000"
				},
				"content3": {
					"DEFAULT": "#e4e4e7",
					"foreground": "#000"
				},
				"content4": {
					"DEFAULT": "#d4d4d8",
					"foreground": "#000"
				},
				"focus": "#006FEE",
				"overlay": "#000000"
				}
			},
			"dark": {
				"colors": {
				"primary": {
					"50": "#3b0925",
					"100": "#5d0e3a",
					"200": "#7f1350",
					"300": "#a11865",
					"400": "#c31d7b",
					"500": "#ce4592",
					"600": "#d86ca9",
					"700": "#e394c0",
					"800": "#edbbd7",
					"900": "#f8e3ef",
					"foreground": "#fff",
					"DEFAULT": "#c31d7b"
				},
				"background": "#000000",
				"foreground": "#ffffff",
				"content1": {
					"DEFAULT": "#18181b",
					"foreground": "#fff"
				},
				"content2": {
					"DEFAULT": "#27272a",
					"foreground": "#fff"
				},
				"content3": {
					"DEFAULT": "#3f3f46",
					"foreground": "#fff"
				},
				"content4": {
					"DEFAULT": "#52525b",
					"foreground": "#fff"
				},
				"focus": "#006FEE",
				"overlay": "#ffffff"
				}
			}
		},
  	}),
		// require("tailwindcss-animate")
	],
}

module.exports = config;