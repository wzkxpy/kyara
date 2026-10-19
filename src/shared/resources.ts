import manifest from '../../resources/manifest.json'

interface ResourceGroup {
  directory: string
  files: Record<string, string>
}

export const resourceManifest: Record<string, ResourceGroup> = manifest

export function getResourceFile(group: string, id: string): string {
  if (!Object.hasOwn(resourceManifest, group)) {
    throw new Error(`资源分组未登记：${group}`)
  }
  const { directory, files } = resourceManifest[group]
  if (!Object.hasOwn(files, id)) {
    throw new Error(`资源未登记：${group}/${id}`)
  }
  const filename = files[id]
  // 每项只允许文件名，子目录统一在分组中定义。
  if (!filename || filename === '.' || filename === '..' || /[\\/:]/.test(filename)) {
    throw new Error(`资源文件名无效：${group}/${id}`)
  }
  return `${directory}/${filename}`
}

export function getResourceUrl(group: string, id: string): string {
  getResourceFile(group, id)
  return `game-resource://assets/${encodeURIComponent(group)}/${encodeURIComponent(id)}`
}
