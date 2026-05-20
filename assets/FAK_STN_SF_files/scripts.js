const Chargeblast = {
  identify: async function (email) {
    try {
      if (typeof email !== "string") {
        throw new Error("indentify parameter must be a string value");
      }
      const script = document.getElementById("chargeblast-script");
      if (!script) {
        throw new Error("chargeblast-script was not found");
      }

      const account = script.getAttribute("data-account");
      if (account == null) {
        throw new Error("Account must be set as data attribute");
      }

      const body = JSON.stringify({
        account: account,
        ip: await getIpAddress(),
        email: email,
      });

      const url = "https://api.chargeblast.com/track";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.host,
        },
        body: body,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error("Chargeblast Script Error:", error);
    }
  },
};

async function getIpAddress() {
  const url = `https://api.ipify.org?format=json&callback=IP`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data = await response.json();
  return data.ip;
}
