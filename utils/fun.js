function delay(ms, value) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(value);
    }, ms);
  });
}

async function getUserFlow() {
  try {
    let name = await delay(1000, "Meet");
    console.log(name);
    let status = await delay(1000, "fetch from DB");
    console.log(name, ":", status);
  } catch (error) {
    console.log(error);
  }
}

getUserFlow();