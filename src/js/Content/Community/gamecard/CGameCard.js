import ContextType from "../../../Modules/Content/Context/ContextType";
import {CCommunityBase} from "../common/CCommunityBase";
import FCardExchangeLinks from "../common/FCardExchangeLinks";
import FCardMarketLinks from "./FCardMarketLinks";
import FCardFoilLink from "./FCardFoilLink";
import FTradeForumLink from "./FTradeForumLink";

import {GameId} from "../../../Modules/Core/GameId";

export class CGameCard extends CCommunityBase {

    constructor() {

        super(ContextType.GAME_CARD, [
            FCardExchangeLinks,
            FCardMarketLinks,
            FCardFoilLink,
            FTradeForumLink,
        ]);

        this.appid = GameId.getAppidFromGameCard(window.location.pathname);
        this.isFoil = window.location.search.includes("?border=1");
    }
}
