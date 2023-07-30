import { log } from "./log.ts";
type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<TRequest, TResponse>(
  url: string,
  method: RequestMethod,
  body?: TRequest,
  headers?: HeadersInit,
): Promise<TResponse> {
  try {
    if (!headers) {
      headers = new Headers({
        "Content-Type": "application/json",
      });
    }

    const options: RequestInit = {
      method,
      headers,
      body: JSON.stringify(body),
      redirect: "follow",
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json() as Promise<TResponse>;
  } catch (error) {
    log.error(error);
    throw error;
  }
}

export async function get<TResponse>(url: string): Promise<TResponse> {
  return request<undefined, TResponse>(url, "GET");
}

export async function post<TRequest, TResponse>(
  url: string,
  body?: TRequest,
  headers?: HeadersInit,
): Promise<TResponse> {
  return request<TRequest, TResponse>(url, "POST", body, headers);
}

export async function put<TRequest, TResponse>(
  url: string,
  body?: TRequest,
): Promise<TResponse> {
  return request<TRequest, TResponse>(url, "PUT", body);
}

export async function patch<TRequest, TResponse>(
  url: string,
  body?: TRequest,
): Promise<TResponse> {
  return request<TRequest, TResponse>(url, "PATCH", body);
}

export async function del<TResponse>(url: string): Promise<TResponse> {
  return request<undefined, TResponse>(url, "DELETE");
}
