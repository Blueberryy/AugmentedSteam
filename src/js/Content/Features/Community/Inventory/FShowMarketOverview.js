import {HTML, Localization} from "../../../../modulesCore";
import {Background, CallbackFeature, CurrencyManager, RequestData} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FShowMarketOverview extends CallbackFeature {

    async callback({
        view,
        assetId,
        contextId,
        globalId,
        walletCurrency,
        marketable,
        hashName,
        restriction,
        appid,
        isBooster
    }) {

        /*
         * If the item in user's inventory is not marketable due to market restrictions,
         * or if not in own inventory but the item is marketable, build the HTML for showing info
         */
        if (!(this.context.myInventory && restriction && !marketable) && !marketable) { return; }

        const thisItem = document.getElementById(`${globalId}_${contextId}_${assetId}`);
        const marketActions = document.getElementById(`iteminfo${view}_item_market_actions`);

        // If is a booster pack get the average price of three cards
        if (isBooster && !thisItem.dataset.cardsPrice) {
            if (thisItem.classList.contains("es_avgprice_loading")) { return; }
            thisItem.classList.add("es_avgprice_loading");

            thisItem.dataset.cardsPrice = "nodata";

            try {
                const currency = CurrencyManager.currencyNumberToType(walletCurrency);
                const result = await Background.action("market.averagecardprices",
                    {
                        currency,
                        "appids": appid,
                        "foilappids": appid
                    });

                const avgPrice
                    = (
                        (result[appid].foil.average * FShowMarketOverview._foilChance)
                        + (result[appid].regular.average * (1 - FShowMarketOverview._foilChance))
                    ).toFixed(2) * 100;

                thisItem.dataset.cardsPrice = await Page.runInPageContext((price, type) => {
                    return window.SteamFacade.vCurrencyFormat(price, type);
                }, [avgPrice, currency], true);
            } catch (err) {
                console.error("Failed to retrieve average card prices for appid", appid, err);
            } finally {
                thisItem.classList.remove("es_avgprice_loading");
            }
        }

        let firstDiv = marketActions.querySelector(":scope > div");
        if (firstDiv) {

            // In own inventory, only add the average price of three cards to booster packs
            if (thisItem.dataset.cardsPrice && thisItem.dataset.cardsPrice !== "nodata") {

                const priceInfoDiv = firstDiv.querySelector("div:nth-child(2)");

                /*
                 * Due to race conditions the lowest price might have already been fetched (e.g. when request is loaded from cache).
                 * Therefore the Ajax handler wouldn't get triggered.
                 * This comparison checks for the existence of the text node "Starting at: ..."
                 */
                if (priceInfoDiv.firstChild.nodeType === Node.TEXT_NODE) {
                    priceInfoDiv.append(Localization.str.avg_price_3cards.replace("__price__", thisItem.dataset.cardsPrice));
                } else {

                    // Wait for population of the div https://github.com/SteamDatabase/SteamTracking/blob/6c5145935aa0a9f9134e724d89569dfd1f2af014/steamcommunity.com/public/javascript/economy_v2.js#L3563
                    Page.runInPageContext(hashName => new Promise(resolve => {
                        function onComplete(response) {
                            if (!response.url.startsWith("https://steamcommunity.com/market/priceoverview/") || response.parameters.market_hash_name !== hashName) {
                                return;
                            }

                            resolve();
                            window.Ajax.Responders.unregister(onComplete);
                        }

                        window.Ajax.Responders.register({onComplete});
                    }), [hashName], true).then(() => {
                        firstDiv.querySelector("div:nth-child(2)")
                            .append(Localization.str.avg_price_3cards.replace("__price__", thisItem.dataset.cardsPrice));
                    });
                }
            }

            return;
        }

        firstDiv = document.createElement("div");
        marketActions.insertAdjacentElement("afterbegin", firstDiv);
        marketActions.style.display = "block";

        const _hashName = encodeURIComponent(hashName);

        // "View in market" link
        let html = `<div style="height:24px;">
                        <a href="//steamcommunity.com/market/listings/${globalId}/${_hashName}">${Localization.str.view_in_market}</a>
                    </div>`;

        // Check if price is stored in data
        if (!thisItem.dataset.lowestPrice) {
            if (firstDiv.querySelector("img.es_loading") !== null) { return; }

            HTML.inner(firstDiv, '<img class="es_loading" src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif">');

            thisItem.dataset.lowestPrice = "nodata";
            thisItem.dataset.soldVolume = "nodata";

            try {
                const data = await RequestData.getJson(`https://steamcommunity.com/market/priceoverview/?currency=${walletCurrency}&appid=${globalId}&market_hash_name=${_hashName}`);

                if (data && data.success) {
                    thisItem.dataset.lowestPrice = data.lowest_price || "nodata";
                    thisItem.dataset.soldVolume = data.volume || "nodata";
                }
            } catch (err) {
                console.error("Couldn't load price overview from market", err);
                HTML.inner(firstDiv, html); // add market link anyway
                return;
            }
        }

        html += this._getMarketOverviewHtml(thisItem);
        html += '<div class="market_item_action_buyback_at_price"></div>'; // Steam spacing

        HTML.inner(firstDiv, html);
    }

    _getMarketOverviewHtml(node) {

        let html = '<div style="min-height:3em;margin-left:1em;">';

        if (node.dataset.lowestPrice && node.dataset.lowestPrice !== "nodata") {
            html += Localization.str.starting_at.replace("__price__", node.dataset.lowestPrice);

            if (node.dataset.soldVolume && node.dataset.soldVolume !== "nodata") {
                html += "<br>";
                html += Localization.str.volume_sold_last_24.replace("__sold__", node.dataset.soldVolume);
            }

            // cards price data is only fetched for booster packs
            if (node.dataset.cardsPrice && node.dataset.cardsPrice !== "nodata") {
                html += "<br>";
                html += Localization.str.avg_price_3cards.replace("__price__", node.dataset.cardsPrice);
            }
        } else {
            html += Localization.str.no_price_data;
        }

        html += "</div>";
        return html;
    }
}

// https://steamcommunity.com/groups/tradingcards/discussions/1/864969482042344380/#c864969482044786566
FShowMarketOverview._foilChance = 0.01;
