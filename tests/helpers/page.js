const puppeteer = require("puppeteer");
const sessionFactory = require("../factories/sessionFactory");
const userFactory = require("../factories/userFactory");

class CustomPage {
  static async build() {
    //don't forget to add object to launch function
    //execute in headless mode to run faster
    //All puppeteers operations are async
    //for prod and ci mode use headless: true and args: ["--no-sandbox"]: travis is using a virtual machine and helps with runing test time
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    //we have our browser and our page and we need an instance of customPage and whenever we create an instance of it we're going to save a reference to it on this.page on constructor
    const customPage = new CustomPage(page, browser);

    return new Proxy(customPage, {
      get: function (target, property) {
        //including the browser[property] into the proxy we never have to worry about working with the browser. We can just use all the functions on the proxy itself to manage access to the browser and close it or do whatever else we need to do with it.
        return customPage[property] || browser[property] || page[property];
      },
    });
  }

  constructor(page, browser) {
    this.page = page;
  }

  async login(path = "/") {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    //take session string and session signature and setting them on an actual cookie on our chromium instance with puppeteer using page.setCookie. If we don't set the domain, when we set the cookie, we have to first navigate to our app (await page.goto("localhost:3000")) and then set the cookie
    //for name value for page.setCookie function argument's object, we go on chrome dev tool - application - cookies and we have two cookies names: session and session.sig that we have to set.
    await this.page.setCookie({ name: "session", value: session });
    await this.page.setCookie({ name: "session.sig", value: sig });

    //after we set the cookies we have to refresh the page to simulates an actuall logging into the app. this will cause our entire app to rerender and we should see an updated header appear.
    await this.page.goto(`http://localhost:3000/${path}`);
    //await for response from our server
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  //in the interes of DRY style
  async getContentsOf(selector) {
    return this.page.$eval(selector, (el) => el.innerHTML);
  }

  get(path) {
    return this.page.evaluate(
      (_path) =>
        fetch(_path, {
          method: "GET",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
        }).then((res) => res.json()),
      path
    );
  }

  post(path, data) {
    return this.page.evaluate(
      (_path, _data) =>
        fetch(_path, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(_data),
        }).then((res) => res.json()),
      path,
      data
    );
  }

  execRequests(actions) {
    return Promise.all(
      actions.map(({ method, path, data }) => {
        return this[method](path, data);
      })
    );
  }

  //   close() {
  //     this.browser.close();
  //   }
}

module.exports = CustomPage;
