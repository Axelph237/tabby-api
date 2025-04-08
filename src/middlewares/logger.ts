import logixlysia from 'logixlysia'

export const logger = logixlysia({
	config: {
		showStartupMessage: true,
		startupMessageFormat: 'simple',
		timestamp: {
			translateTime: 'yyyy-mm-dd HH:MM:ss'
		},
		ip: true,
		logFilePath: './logs/app.log',
		customLogFormat:
			'🐈 {now} {level} {duration} {method} {pathname} {status} {message} {ip} {epoch}',
		// logFilter: {
		// 	level: ['ERROR', 'WARNING'],
		// 	status: [500, 404],
		// 	method: 'GET'
		// }
	}
})