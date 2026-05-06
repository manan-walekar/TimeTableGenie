/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
    safelist: [
      'bg-orange-100', 'text-orange-600', 'dark:bg-orange-500/10', 'dark:text-orange-400',
      'bg-orange-50', 'border-orange-200', 'text-orange-700',
      'bg-rose-50', 'border-rose-200', 'text-rose-700',
      'bg-violet-50', 'border-violet-200', 'text-violet-700',
      'bg-cyan-50', 'border-cyan-200', 'text-cyan-700',
      'bg-blue-50', 'text-blue-500', 'bg-blue-500', 'bg-blue-100', 'text-blue-600', 'text-blue-700', 'bg-blue-100',
      'bg-green-50', 'text-green-500', 'bg-green-500', 'bg-green-100', 'text-green-600', 'text-green-700',
      'bg-purple-50', 'text-purple-500', 'bg-purple-500', 'bg-purple-100', 'text-purple-600', 'text-purple-700',
      'bg-red-50', 'text-red-500', 'bg-red-100', 'text-red-600', 'text-red-700',
      'bg-yellow-400', 'bg-orange-400', 'bg-indigo-500', 'bg-pink-500',
      'from-blue-500', 'to-blue-700', 'from-green-500', 'to-green-700',
      'from-purple-500', 'to-purple-700', 'from-orange-500', 'to-red-500',
      'from-gray-600', 'to-gray-800', 'from-teal-600', 'to-teal-600', 'from-pink-500', 'to-rose-600',
      'bg-blue-100', 'border-blue-300', 'text-blue-800',
      'bg-green-100', 'border-green-300', 'text-green-800',
      'bg-yellow-100', 'border-yellow-300', 'text-yellow-800',
      'bg-pink-100', 'border-pink-300', 'text-pink-800',
      'bg-purple-100', 'border-purple-300', 'text-purple-800',
      'bg-teal-100', 'border-teal-300', 'text-teal-800',
    ],
  theme: {
  	extend: {
  		fontFamily: {
  			inter: ['var(--font-inter)']
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}