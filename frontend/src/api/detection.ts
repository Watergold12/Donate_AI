import { apiClient } from './client'
import type { APIResponse, DetectionResponse } from '../types/index'

export const detectionApi = {
  analyze: (imageFile: File) => {
    const form = new FormData()
    form.append('image', imageFile)
    return apiClient.post<APIResponse<DetectionResponse>>('/detection/analyze', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
