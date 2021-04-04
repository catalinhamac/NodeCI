const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  //the order of proxu matters, from page.js elper: customPage[property] || page[property] || browser[property];
  //first will look for close property on customPage after that on page and at the end on browser which we really need. The page has a close method also and that will be called and we don't need it.
  //one way to solve this is to reference browser on the instance, in constructor set this.browser= browser and set a close method on CustomPage class and call this.browser.close();
  //second way to solve this is by setting browser priority like: return customPage[property] || browser[property] || page[property];
  await page.close();
});

test.skip("the header has the correct text", async () => {
  const text = await page.getContentsOf("a.brand-logo");

  expect(text).toEqual("Blogster");
});

test.skip("clicking login starts oauth flow", async () => {
  await page.click(".right a");
  const url = await page.url();

  expect(url).toMatch(/accounts\.google\.com/);
});

test.skip("when signed in, shows logout button", async () => {
  await page.login();

  const text = await page.getContentsOf(
    'a[href="/auth/logout"]',
    (el) => el.innerHTML
  );

  expect(text).toEqual("Logout");
});

//1.Example of extending Page class from puppeteer to add a login method
// const { Page } = require("puppeteer/lib/Page");
// Page.prototype.login = function () {
//   const user = await userFactory();
//   const { session, sig } = sessionFactory(user);

//   await this.setCookie({ name: "session", value: session });
//   await this.setCookie({ name: "session.sig", value: sig });
//   await this.goto("localhost:3000");
//   await this.waitFor('a[href="/auth/logout"]');
// };

//2. Example If we want to extend Page class from puppeteer using extends keyword like below code but we unfortunately cannot tell puppeteer very easily to use this extended class PageInstace.

//Class PageInstance extends Page{}

//3. Example with creating an custom page class that take an instance of page as argument, but we have to call methods very verbose like customPage.page.goto(). Besides that we're really going to always be working with that underlying page object all the time.
// class Page {
//   goto(){
//     console.log('I\'m going to another page')
//   }

//   setCookie(){
//     console.log('I\m setting a cookie')
//   }
// }

// class CustomPage {
//   constructor(page){
//     this.page=page
//   }

//   login(){
//     this.page.goto();
//     this.page.setCookie();
//   }
// }

// const page = new Page();
// const customPage = new CustomPage(page);
// customPage.login();

//4. Example JS proxy
// class Greetings {
//   english(){
//     return 'hello'
//   }
//   spanish(){
//     return "hola"
//   }
// }

// class MoreGreetings {
//   german(){
//     return 'halo'
//   }
//   french(){
//     return 'bonjour'
//   }
// }

// const greetings = new Greetings();
// const moreGreetings = new MoreGreetings();

// const allGreetings = new Proxy(moreGreetings, {
//   get: function(target, property) {
//     return target[property] || greetings[property]
//   }
// });

// const result = allGreetings.english();
