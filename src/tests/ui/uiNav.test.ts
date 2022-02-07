import puppeteer from "puppeteer";
import * as dappeteer from "@chainsafe/dappeteer";
import "regenerator-runtime/runtime";
import { setupDappBrowser, setupDataX, closeBrowser, quickConnectWallet } from "../Setup";
import {
  getSharesFromUnstake,
  navToLp,
  navToRemoveStake,
  navToStake,
  navToTrade,
  getBalanceInMM,
  navToStakeWPool,
  navToLpFromUnstake,
  acceptCookies,
  navToTradeXFromLanding,
} from "../Utilities";

describe("DataX Navigation User Interface Works as Expected", () => {
  jest.setTimeout(300000);
  let page: puppeteer.Page;
  let browser: puppeteer.Browser;
  let metamask: dappeteer.Dappeteer;

  beforeAll(async () => {
    const tools = await setupDappBrowser();
    if (tools) {
      page = tools?.page;
      browser = tools?.browser;
      metamask = tools?.metamask;
    }
    await acceptCookies(page)
    await navToTradeXFromLanding(page)
    await setupDataX(page, metamask, "rinkeby", false);
    await page.bringToFront()
  });

  afterAll(async () => {
    await closeBrowser(browser);
  });

  it("Should have OCEAN balance > 0 to run these tests", async () => {
    const balance = await getBalanceInMM(metamask, "OCEAN");
    await page.waitForFunction('document.querySelector("#loading-lp") === null')
    expect(Number(balance)).toBeGreaterThan(0);
  });

  //General Navigation
  it("Can navigate to Stake", async () => {
    await navToStake(page);
    expect(await page.waitForSelector("#stakeModal")).toBeDefined();
  });
  it("Can navigate to Trade from Stake", async () => {
    await navToStake(page);
    await navToTrade(page);
    expect(await page.waitForSelector("#swapModal")).toBeDefined();
  });
  it("Can navigate to LP from Stake", async () => {
    await navToLp(page);
    expect(await page.waitForSelector("#lpModal")).toBeDefined();
  });
  it("Can navigate to Unstake from LP", async () => {
    await navToRemoveStake(page, "SAGKRI-94");
    expect(await page.waitForSelector("#removeStakeModal")).toBeDefined();
  });
  it("Can reload on Unstake", async () => {
    await page.reload();
    await quickConnectWallet(page)
    expect(await page.waitForSelector("#removeStakeModal")).toBeDefined();
    // const shares = await getShares(page);
    // expect(Number(shares)).toBeGreaterThan(0);
  });
  it("Can navigate to LP from unstake", async () => {
    await navToLpFromUnstake(page);
    expect(await page.waitForSelector("#lpModal")).toBeDefined();
  });
  it("Can navigate to Stake from LP", async () => {
    await navToLp(page);
    await navToStakeWPool(page, "SAGKRI-94");
    await page.waitForSelector("#stakeToken");
    const text = await page.evaluate('document.querySelector("#stakeToken").innerText');
    expect(text).toBe("SAGKRI-94");
  });
  it("Can reload on Stake with token selected", async () => {
    await page.reload();
    await quickConnectWallet(page)
    await page.waitForSelector("#stakeToken");
    const text = await page.evaluate('document.querySelector("#stakeToken").innerText');
    expect(text).toBe("SAGKRI-94");
  });
});