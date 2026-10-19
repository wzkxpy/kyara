import { app, net, protocol } from 'electron'
import { realpath } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { getResourceFile } from '../../shared/resources'

export function registerResourceProtocol(): void {
  const root = app.isPackaged
    ? path.join(process.resourcesPath, 'game')
    : path.join(app.getAppPath(), 'resources')

  protocol.handle('game-resource', async (request) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405 })
    }
    try {
      const url = new URL(request.url)
      const segments = url.pathname.slice(1).split('/').map(decodeURIComponent)
      if (url.host !== 'assets' || segments.length !== 2) {
        return new Response(null, { status: 404 })
      }
      const [group, id] = segments
      const resourceFile = getResourceFile(group, id)
      // 真实路径校验同时阻止符号链接越过资源目录。
      const realRoot = await realpath(root)
      const file = await realpath(path.resolve(realRoot, resourceFile))
      const relative = path.relative(realRoot, file)
      if (
        !relative ||
        relative === '..' ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative)
      ) {
        return new Response(null, { status: 403 })
      }
      return await net.fetch(pathToFileURL(file).href, {
        method: request.method,
        headers: request.headers
      })
    } catch {
      return new Response(null, { status: 404 })
    }
  })
}
