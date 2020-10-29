import ContextType from "../../../Modules/Content/Context/ContextType";
import {CCommunityBase} from "../common/CCommunityBase";
import FFriendsCount from "./FFriendsCount";
import FFriendsPlaytimeSort from "./FFriendsPlaytimeSort";
import FFriendsThatOwn from "./FFriendsThatOwn";

export class CFriendsThatPlay extends CCommunityBase {

    constructor() {
        super(ContextType.FRIENDS_THAT_PLAY, [
            FFriendsCount,
            FFriendsPlaytimeSort,
            FFriendsThatOwn,
        ]);

        this.appid = parseInt(window.location.pathname.match(/\/friendsthatplay\/(\d+)/)[1]);
    }
}
