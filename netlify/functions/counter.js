const COUNTER_KEY = process.env.DOWNLOAD_COUNTER_KEY || "moonback:download_clicks";

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(payload),
  };
}

async function upstashRequest(command) {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!baseUrl || !token) {
    throw new Error("Missing Upstash env vars");
  }

  const res = await fetch(`${baseUrl}/${command.join("/")}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upstash request failed: ${text}`);
  }

  return res.json();
}

exports.handler = async function handler(event) {
  try {
    if (event.httpMethod === "GET") {
      const data = await upstashRequest(["get", COUNTER_KEY]);
      const count = Number(data.result || 0);
      return json(200, { count: Number.isNaN(count) ? 0 : count });
    }

    if (event.httpMethod === "POST") {
      const data = await upstashRequest(["incr", COUNTER_KEY]);
      const count = Number(data.result || 0);
      return json(200, { count: Number.isNaN(count) ? 0 : count });
    }

    return json(405, { error: "Method not allowed" });
  } catch (err) {
    return json(500, {
      error: "counter_failed",
      message: err.message,
    });
  }
};
