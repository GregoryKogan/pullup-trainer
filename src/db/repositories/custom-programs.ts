import { db } from '../database'
import type { CustomProgram } from '@/domain/types'

export async function loadCustomPrograms(): Promise<CustomProgram[]> {
  return db.customPrograms.toArray()
}

export async function saveCustomProgram(program: CustomProgram): Promise<number> {
  if (program.id !== undefined) {
    await db.customPrograms.put(program)
    return program.id
  }
  return (await db.customPrograms.add(program)) as number
}

export async function deleteCustomProgram(id: number): Promise<void> {
  await db.customPrograms.delete(id)
}

export async function getCustomProgram(id: number): Promise<CustomProgram | undefined> {
  return db.customPrograms.get(id)
}
