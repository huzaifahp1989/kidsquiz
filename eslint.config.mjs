/* eslint-disable import/no-anonymous-default-export */
import nextConfig from 'eslint-config-next';

export default [
	...nextConfig,
	{
		rules: {
			'react/no-unescaped-entities': 'off',
		},
	},
];
