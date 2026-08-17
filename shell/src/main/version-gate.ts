import { SUPPORTED_DSH_PREFIX } from '../shared/constants'

export interface GateResult {
  /** false means "warn" for MVP — never blocks the shell. */
  ok: boolean
  message: string
}

/** Warn-only compatibility gate against the tested dsh version range. */
export function checkCoreVersion(version: string): GateResult {
  const v = version.trim()
  if (!v) {
    return { ok: false, message: '无法读取 dsh 核心版本（--version 无输出）' }
  }
  if (!v.startsWith(SUPPORTED_DSH_PREFIX)) {
    return {
      ok: false,
      message: `dsh 核心版本 ${v} 与测试范围 ${SUPPORTED_DSH_PREFIX}.x 不一致，可能遇到兼容性问题（继续运行）`,
    }
  }
  return { ok: true, message: `dsh 核心 ${v} 在支持范围内` }
}
