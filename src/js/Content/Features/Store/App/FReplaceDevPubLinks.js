import {HTML} from "../../../../Core/Html/Html";
import {Localization} from "../../../../Core/Localization/Localization";
import {Feature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FReplaceDevPubLinks extends Feature {

    apply() {
        const devs = Array.from(
            document.querySelectorAll(".glance_ctn_responsive_left > .dev_row:nth-child(3) a, .details_block > .dev_row:first-of-type > a")
        );
        const pubs = Array.from(
            document.querySelectorAll(".glance_ctn_responsive_left > .dev_row:nth-child(4) a, .details_block > .dev_row:nth-of-type(2) > a")
        );
        let franchise = document.querySelector(".details_block > .dev_row:nth-of-type(3) > a");
        franchise = franchise ? [franchise] : [];

        for (const node of [...devs, ...pubs, ...franchise]) {
            const homepageLink = new URL(node.href);
            if (homepageLink.pathname.startsWith("/search/")) { continue; }

            let type;
            if (devs.includes(node)) {
                type = "developer";
            } else if (pubs.includes(node)) {
                type = "publisher";
            } else if (franchise === node) {
                type = "franchise";
            }
            if (!type) { continue; }

            node.href = `https://store.steampowered.com/search/?${type}=${encodeURIComponent(node.textContent)}`;
            HTML.afterEnd(node, ` (<a href="${homepageLink.href}">${Localization.str.options.homepage}</a>)`);
        }

        for (const moreBtn of document.querySelectorAll(".dev_row > .more_btn")) {
            moreBtn.remove();
        }

        Page.runInPageContext(() => {
            window.SteamFacade.collapseLongStrings(".dev_row .summary.column");
        });
    }
}
