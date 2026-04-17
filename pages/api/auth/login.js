export default function handler(req, res) {
  if (req.method === "POST") {
    const { email, password } = req.body;

    if (email === "admin@test.com" && password === "123456") {
      return res.status(200).json({ success: true });
    }

    return res.status(401).json({ error: "Invalid credentials" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
