import ContextType from "../../../Modules/Content/Context/ContextType";
import {GameId} from "../../../Modules/Core/GameId";
import FHighlightsTags from "../../common/FHighlightsTags";
import FSkipAgecheck from "../../common/FSkipAgecheck";
import {CCommunityBase} from "../common/CCommunityBase";
import FCommunityAppPageLinks from "./FCommunityAppPageLinks";
import FCommunityAppPageWishlist from "./FCommunityAppPageWishlist";

export class CApp extends CCommunityBase {

    constructor(features = []) {

        features.push(
            FCommunityAppPageLinks,
            FCommunityAppPageWishlist,
            FSkipAgecheck,
        );

        super(ContextType.COMMUNITY_APP, features);

        this.appid = GameId.getAppid(window.location.href);

        FHighlightsTags.highlightTitle(this.appid);

        const node = document.querySelector(".apphub_background");
        if (node) {
            new MutationObserver(() => {
                this.triggerCallbacks();
            }).observe(node, {"attributes": true}); // display changes to none if age gate is shown
        }
    }
}
