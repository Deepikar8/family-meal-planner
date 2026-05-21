import nextVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...nextVitals,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'tsconfig.tsbuildinfo',
    ],
  },
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]

export default config
